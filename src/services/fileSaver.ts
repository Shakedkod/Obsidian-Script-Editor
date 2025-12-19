export function saveAsOld(blob: Blob, filename: string): void {
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export async function saveAs(blob: Blob, filename: string): Promise<void> {
    // Check if the File System Access API is supported
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'PDF Files',
                    accept: { 'application/pdf': ['.pdf'] },
                }],
            });
            
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (err) {
            // User cancelled or error occurred, fall back to basic method
            console.log('File System Access API failed, using fallback');
        }
    }
    
    // Fallback to basic method
    saveAsOld(blob, filename);
}