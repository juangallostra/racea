import type { ChangeEvent } from 'react';
import type { ActivitySource } from '../domain/activity';

interface ActivityUploaderProps {
  onFileLoaded: (fileName: string, source: ActivitySource, data: string | ArrayBuffer) => void;
  onError: (message: string) => void;
}

function detectSource(fileName: string): ActivitySource | undefined {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.gpx')) return 'gpx';
  if (lower.endsWith('.fit')) return 'fit';
  return undefined;
}

export function ActivityUploader({ onFileLoaded, onError }: ActivityUploaderProps) {
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const source = detectSource(file.name);

    if (!source) {
      onError('El archivo seleccionado debe tener extensión .gpx o .fit.');
      event.target.value = '';
      return;
    }

    try {
      const data = source === 'gpx' ? await file.text() : await file.arrayBuffer();
      onFileLoaded(file.name, source, data);
    } catch {
      onError('No se ha podido leer el archivo de actividad.');
    } finally {
      event.target.value = '';
    }
  }

  return (
    <section className="card uploader-card">
      <div>
        <p className="eyebrow">Paso 1</p>
        <h2>Cargar actividad</h2>
        <p>Selecciona un archivo GPX o FIT. Todo el procesamiento se realiza en el navegador.</p>
      </div>

      <label className="file-input-label">
        <span>Seleccionar GPX / FIT</span>
        <input type="file" accept=".gpx,.fit,application/gpx+xml,text/xml,application/xml,application/octet-stream" onChange={handleFileChange} />
      </label>
    </section>
  );
}
