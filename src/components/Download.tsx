type Props = {
    fileContent: string;
    fileName: string;
}

export default function DownloadButton({ fileContent, fileName }: Props) {
    const downloadBook = () => {
        // alert(`Downloading ${fileName}`);
        const url = URL.createObjectURL(new Blob([fileContent]));
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return (
        <>
            <button onClick={downloadBook}>Download as .Stendhal</button>
        </>
    )
}