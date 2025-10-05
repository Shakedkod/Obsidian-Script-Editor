import * as React from "react";
import { useEffect, useState } from "react";

interface Props
{
    data: string;
    setData: (data: string) => void;
}

function _ScriptEditor({data, setData}: Props): JSX.Element
{
    const [fullFile, setFullFile] = useState(data);
    
    useEffect(() =>
    {
        setData(fullFile);
    }, [fullFile]);

    return (
        <div>
            <textarea
                value={fullFile}
                onChange={(e) => setFullFile(e.target.value)}
            />
        </div>
    );
}


export default function ScriptEditor({data, setData}: Props): () => JSX.Element
{
    return () => (
        <>
            <_ScriptEditor
                data={data}
                setData={setData}
            />
        </>
    );
}