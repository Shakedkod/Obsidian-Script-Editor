interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: Array<{
        description: string;
        accept: Record<string, string[]>;
    }>;
}

interface FileSystemWritableFileStream {
    write(data: Blob): Promise<void>;
    close(): Promise<void>;
}

interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
}

type WindowWithFilePicker = Window & {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
};

export function saveAsOld(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export async function saveAs(blob: Blob, filename: string): Promise<void> {
    const win = window as WindowWithFilePicker;
    if (typeof win.showSaveFilePicker === "function") {
        try {
            const handle = await win.showSaveFilePicker({
                suggestedName: filename,
                types: [
                    {
                        description: "PDF Files",
                        accept: { "application/pdf": [".pdf"] },
                    },
                ],
            });

            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch {
            // Fall back to anchor download if cancelled or unsupported
        }
    }

    saveAsOld(blob, filename);
}
