import React from 'react';

export function SceneHeading({ children }: { children: string }) {
    return (
        <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginTop: '1em' }}>
            {children}
        </div>
    );
}

export function Action({ children }: { children: string }) {
    return (
        <div style={{ marginTop: '0.5em', lineHeight: '1.5' }}>
            {children}
        </div>
    );
}

export function Character({ children }: { children: string }) {
    return (
        <div style={{ textAlign: 'center', textTransform: 'uppercase', marginTop: '1em' }}>
            {children}
        </div>
    );
}

export function Dialogue({ children }: { children: string }) {
    return (
        <div style={{ textAlign: 'center', maxWidth: '60%', margin: '0 auto', lineHeight: '1.5' }}>
            {children}
        </div>
    );
}

export function Parenthetical({ children }: { children: string }) {
    return (
        <div style={{ fontStyle: 'italic', textAlign: 'center', marginTop: '0.2em' }}>
            ({children})
        </div>
    );
}

export function Transition({ children }: { children: string }) {
    return (
        <div style={{ textAlign: 'right', textTransform: 'uppercase', marginTop: '1em' }}>
            {children}
        </div>
    );
}

export function Subheader({ children }: { children: string }) {
    return (
        <div style={{ textAlign: 'center', textTransform: 'uppercase', marginTop: '1em' }}>
            ({children})
        </div>
    );
}
