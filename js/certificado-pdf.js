// Módulo dedicado a generar el certificado en una sola hoja tamaño Carta horizontal (letter, landscape)
(function () {
    const generarPDFCertificadoOriginal = window.generarPDFCertificado;

    function ajustarCertificadoParaCartaHorizontal(elemento) {
        const padre = elemento.parentElement;
        const padreSnapshot = padre ? {
            display: padre.style.display,
            position: padre.style.position,
            left: padre.style.left,
            top: padre.style.top,
            visibility: padre.style.visibility
        } : null;

        const snapshot = {
            width: elemento.style.width,
            minWidth: elemento.style.minWidth,
            maxWidth: elemento.style.maxWidth,
            height: elemento.style.height,
            minHeight: elemento.style.minHeight,
            maxHeight: elemento.style.maxHeight,
            margin: elemento.style.margin,
            padding: elemento.style.padding,
            transform: elemento.style.transform,
            transformOrigin: elemento.style.transformOrigin,
            boxSizing: elemento.style.boxSizing,
            overflow: elemento.style.overflow,
            position: elemento.style.position,
            left: elemento.style.left,
            top: elemento.style.top,
            zoom: elemento.style.zoom
        };

        // Dimensiones en píxeles equivalentes a Carta horizontal (11 in x 8.5 in a ~96 DPI: 1056 x 816 px)
        const anchoCartaPx = 1056;
        const altoCartaPx = 816;

        if (padre) {
            padre.style.display = 'block';
            padre.style.position = 'fixed';
            padre.style.left = '-9999px';
            padre.style.top = '0';
            padre.style.visibility = 'visible';
        }

        elemento.style.boxSizing = 'border-box';
        elemento.style.position = 'relative';
        elemento.style.left = '0';
        elemento.style.top = '0';
        elemento.style.margin = '0';
        elemento.style.zoom = '1';
        elemento.style.transformOrigin = 'top left';
        elemento.style.overflow = 'hidden';

        // Ajuste directo al tamaño de Carta horizontal sin transform: scale para evitar recortes en html2canvas
        elemento.style.width = anchoCartaPx + 'px';
        elemento.style.minWidth = anchoCartaPx + 'px';
        elemento.style.maxWidth = anchoCartaPx + 'px';
        elemento.style.height = altoCartaPx + 'px';
        elemento.style.minHeight = altoCartaPx + 'px';
        elemento.style.maxHeight = altoCartaPx + 'px';
        elemento.style.transform = 'none';

        return function restaurar() {
            elemento.style.width = snapshot.width;
            elemento.style.minWidth = snapshot.minWidth;
            elemento.style.maxWidth = snapshot.maxWidth;
            elemento.style.height = snapshot.height;
            elemento.style.minHeight = snapshot.minHeight;
            elemento.style.maxHeight = snapshot.maxHeight;
            elemento.style.margin = snapshot.margin;
            elemento.style.padding = snapshot.padding;
            elemento.style.transform = snapshot.transform;
            elemento.style.transformOrigin = snapshot.transformOrigin;
            elemento.style.boxSizing = snapshot.boxSizing;
            elemento.style.overflow = snapshot.overflow;
            elemento.style.position = snapshot.position;
            elemento.style.left = snapshot.left;
            elemento.style.top = snapshot.top;
            elemento.style.zoom = snapshot.zoom;

            if (padre && padreSnapshot) {
                padre.style.display = padreSnapshot.display;
                padre.style.position = padreSnapshot.position;
                padre.style.left = padreSnapshot.left;
                padre.style.top = padreSnapshot.top;
                padre.style.visibility = padreSnapshot.visibility;
            }
        };
    }

    window.generarPDFCertificado = function (idCapacitacion) {
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
                    const restaurarEstilos = ajustarCertificadoParaCartaHorizontal(elementoPDF);

                    const opciones = {
                        margin: 0,
                        filename: `Certificado_${d.capacitacion.replace(/\s+/g, '_')}_${d.identificacion}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: {
                            scale: 2,
                            useCORS: true,
                            scrollX: 0,
                            scrollY: 0,
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
                            // Garantiza que nunca quede más de 1 página en el PDF
                            while (pdf.internal.getNumberOfPages() > 1) {
                                pdf.deletePage(pdf.internal.getNumberOfPages());
                            }
                        })
                        .save()
                        .then(() => {
                            restaurarEstilos();
                            alert('¡Certificado descargado exitosamente!');
                        })
                        .catch((err) => {
                            restaurarEstilos();
                            alert('Error al generar el PDF: ' + err);
                        });
                }, 500);
            } else {
                alert('Error: ' + (res.error || 'No se pudieron obtener los datos.'));
            }
        })
        .catch(err => alert('Error de red: ' + err));
    };

    // Referencia conservada por si se requiere invocar en pruebas
    window._generarPDFCertificadoOriginal = generarPDFCertificadoOriginal;
})();
