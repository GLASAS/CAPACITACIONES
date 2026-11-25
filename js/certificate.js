function generarPDFCertificado(idCapacitacion) {
    alert('Generando Certificado PDF...');
    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'obtenerDatosCertificado',
            identificacionUsuario: usuarioIdentificacionGlobal,
            idCapacitacion: idCapacitacion
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            const d = res.data;
            document.getElementById('certNombreUsuario').textContent = d.nombreUsuario;
            document.getElementById('certIdentificacion').textContent = d.identificacion;
            document.getElementById('certNombreCapacitacion').textContent = d.capacitacion;
            document.getElementById('certFechaExpedicion').textContent = d.fecha;
            document.getElementById('certNumeroUnico').textContent = d.numeroCertificado || `GL-${d.identificacion}-${idCapacitacion}`;

            setTimeout(() => {
                const elementoPDF = document.getElementById('certificadoPDF');
                const padre = elementoPDF.parentElement;

                const padreOriginal = padre ? padre.getAttribute('style') || '' : '';
                const elemOriginal = elementoPDF.getAttribute('style') || '';

                // Posicionar en el origen visible (0,0) para que html2canvas no capture lienzo en blanco
                if (padre) {
                    padre.style.display = 'block';
                    padre.style.position = 'fixed';
                    padre.style.left = '0';
                    padre.style.top = '0';
                    padre.style.width = '1056px';
                    padre.style.height = '816px';
                    padre.style.zIndex = '-9999';
                    padre.style.opacity = '1';
                    padre.style.visibility = 'visible';
                    padre.style.overflow = 'hidden';
                }

                elementoPDF.style.display = 'flex';
                elementoPDF.style.position = 'relative';
                elementoPDF.style.left = '0';
                elementoPDF.style.top = '0';
                elementoPDF.style.margin = '0';
                elementoPDF.style.width = '1056px';
                elementoPDF.style.minWidth = '1056px';
                elementoPDF.style.maxWidth = '1056px';
                elementoPDF.style.height = '816px';
                elementoPDF.style.minHeight = '816px';
                elementoPDF.style.maxHeight = '816px';
                elementoPDF.style.boxSizing = 'border-box';
                elementoPDF.style.transform = 'none';
                elementoPDF.style.overflow = 'hidden';

                const restaurar = () => {
                    if (padre) padre.setAttribute('style', padreOriginal);
                    elementoPDF.setAttribute('style', elemOriginal);
                };

                const opciones = {
                    margin: 0,
                    filename: `Certificado_${d.capacitacion.replace(/\s+/g, '_')}_${d.identificacion}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        scrollX: 0,
                        scrollY: 0,
                        x: 0,
                        y: 0,
                        width: 1056,
                        height: 816,
                        windowWidth: 1056,
                        windowHeight: 816
                    },
                    jsPDF: { unit: 'mm', format: 'letter', orientation: 'landscape' },
                    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                };

                html2pdf()
                    .set(opciones)
                    .from(elementoPDF)
                    .toPdf()
                    .get('pdf')
                    .then((pdf) => {
                        while (pdf.internal.getNumberOfPages() > 1) {
                            pdf.deletePage(pdf.internal.getNumberOfPages());
                        }
                    })
                    .save()
                    .then(() => {
                        restaurar();
                        alert('¡Certificado descargado exitosamente!');
                    })
                    .catch((err) => {
                        restaurar();
                        alert('Error al generar el PDF: ' + err);
                    });
            }, 600);
        } else {
            alert('Error: ' + (res.error || 'No se pudieron obtener los datos.'));
        }
    })
    .catch(err => alert('Error de red: ' + err));
}

function ejecutarValidacionPublicaCertificado(numeroCertificado) {
    const contenedor = document.getElementById('contenidoResultadoValidacion');
    contenedor.innerHTML = `<div class="text-center py-3"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i><p class="mt-2 text-muted">Verificando autenticidad...</p></div>`;

    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'validarCertificadoPublico', numeroCertificado: numeroCertificado })
    })
    .then(res => res.json())
    .then(res => {
        if (res.success && res.valido) {
            const d = res.data;
            contenedor.innerHTML = `
                <div class="alert alert-success text-center mb-3 py-3 fw-bold fs-5">
                    <i class="fas fa-check-circle me-2"></i> Certificado Auténtico
                </div>
                <ul class="list-unstyled mb-4" style="font-size: 14px; line-height: 1.8;">
                    <li><i class="fas fa-building text-primary me-2"></i> <b>Empresa:</b> Global Life Ambulancias SAS</li>
                    <li><i class="fas fa-user text-primary me-2"></i> <b>Participante:</b> ${d.nombreUsuario}</li>
                    <li><i class="fas fa-id-card text-primary me-2"></i> <b>Cédula:</b> ${d.identificacion}</li>
                    <li><i class="fas fa-book text-primary me-2"></i> <b>Curso:</b> ${d.capacitacion}</li>
                    <li><i class="fas fa-calendar-alt text-primary me-2"></i> <b>Fecha:</b> ${d.fecha}</li>
                    <li><i class="fas fa-certificate text-primary me-2"></i> <b>Certificado No:</b> ${d.numeroCertificado}</li>
                    <li><i class="fas fa-shield-alt text-success me-2"></i> <b>Estado:</b> <span class="fw-bold text-success">VÁLIDO</span></li>
                </ul>
            `;
        } else {
            contenedor.innerHTML = `
                <div class="alert alert-danger text-center mb-3 py-3 fw-bold fs-5">
                    <i class="fas fa-times-circle me-2"></i> Certificado No Encontrado
                </div>
                <p class="text-muted text-center small mb-0">Este certificado no es válido o no está registrado.</p>
            `;
        }
    })
    .catch(err => contenedor.innerHTML = `<div class="alert alert-danger text-center">Error de red.</div>`);
}

function ejecutarConsultaPublicaCertificaciones(identificacion) {
    const contenedorDatos = document.getElementById('contenidoDatosFuncionarioConsulta');
    const tbodyCursos = document.getElementById('tbodyTablaCursosConsulta');

    contenedorDatos.innerHTML = `<div class="text-center py-3"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i><p class="mt-2 text-muted">Consultando...</p></div>`;
    tbodyCursos.innerHTML = "";

    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'consultarCertificacionesPublicas', identificacion: identificacion })
    })
    .then(res => res.json())
    .then(res => {
        if (res.success && res.existe) {
            const f = res.funcionario;
            contenedorDatos.innerHTML = `
                <div class="row g-2" style="font-size: 14px;">
                    <div class="col-md-6"><b>Nombre:</b> ${f.nombre}</div>
                    <div class="col-md-6"><b>Cédula:</b> ${f.identificacion}</div>
                    <div class="col-md-6"><b>Empresa:</b> Global Life Ambulancias SAS</div>
                    <div class="col-md-6"><b>Cargo:</b> ${f.cargo || 'No especificado'}</div>
                </div>
            `;
            if (!res.cursos || res.cursos.length === 0) {
                tbodyCursos.innerHTML = `<tr><td colspan="9" class="text-muted py-4">No se encontraron cursos.</td></tr>`;
                return;
            }
            res.cursos.forEach(c => {
                let badgeEstado = c.aprobado ? '<span class="badge bg-success">Aprobado</span>' : '<span class="badge bg-secondary">Cursando</span>';
                let numeroCert = c.numeroCertificado || `GL-${f.identificacion}-${c.idCapacitacion}`;
                tbodyCursos.innerHTML += `
                    <tr>
                        <td class="text-start fw-bold">${c.nombreCurso}</td>
                        <td>${c.categoria || 'Capacitación'}</td>
                        <td>${c.fecha || 'N/A'}</td>
                        <td>${c.fecha || 'N/A'}</td>
                        <td>${c.duracion || '1'} horas</td>
                        <td>${badgeEstado}</td>
                        <td class="fw-semibold text-primary">${numeroCert}</td>
                        <td>${c.codigoUnico || 'COD'}</td>
                        <td>${c.aprobado ? `<button class="btn btn-outline-primary btn-sm rounded-pill px-2" onclick="generarPDFCertificado('${c.idCapacitacion}')"><i class="fas fa-download"></i></button>` : 'N/A'}</td>
                    </tr>
                `;
            });
        } else {
            contenedorDatos.innerHTML = `<div class="alert alert-warning text-center m-0 py-3 fw-bold">No se encontraron registros.</div>`;
        }
    })
    .catch(err => contenedorDatos.innerHTML = `<div class="alert alert-danger text-center">Error de red.</div>`);
}
