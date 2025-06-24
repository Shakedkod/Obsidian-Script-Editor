import React from 'react';
import "../../styles.css";
import { App } from 'obsidian';
import { isRTL } from 'src/i18n/i18n'; // Assuming you have a utility function to check RTL

// Helper function to get text direction
function getTextDirection(text: string): 'rtl' | 'ltr' {
    return isRTL(text) ? 'rtl' : 'ltr';
}

export function SceneHeading({ children }: { children: string }) {
    const direction = getTextDirection(children);
    const isRtl = direction === 'rtl';
    
    return (
        <div style={{ 
            fontWeight: 'bold', 
            textTransform: 'uppercase', 
            marginTop: '1em', 
            marginBottom: "1em",
            display: 'inline-block',
            direction: direction,
            textAlign: isRtl ? 'right' : 'left',
            width: '100%'
        }}>
            {children}
        </div>
    );
}

export function Action({ children }: { children: string }) {
    const direction = getTextDirection(children);
    const isRtl = direction === 'rtl';
    
    return (
        <div style={{ 
            marginTop: '0.5em', 
            lineHeight: '1.5',
            direction: direction,
            textAlign: isRtl ? 'right' : 'left'
        }}>
            {children}
        </div>
    );
}

export function Character({ openCharacterNote, children }: { openCharacterNote: (name: string) => void; children: string }) {
    const direction = getTextDirection(children);
    
    return (
        <div 
            style={{ 
                textAlign: 'center', 
                textTransform: 'uppercase', 
                marginTop: '1em',
                direction: direction,
                fontSize: '1.2em',
                fontWeight: 'bold',
                cursor: "pointer",
            }}
            className="character-name"
            onClick={(e) => {
                if (e.ctrlKey || e.metaKey) {
                    openCharacterNote(children);
                }
            }}
        >
            <strong>{children}</strong>
        </div>
    );
}

export function Dialogue({ children }: { children: string }) {
    const direction = getTextDirection(children);
    var centered = false;

    if (children.startsWith("\""))
    {
        children = children.slice(1); // Remove leading quote if present
        centered = true; // Center dialogue if it starts with a quote
    }

    return (
        <div style={{ 
            textAlign: centered ? 'center' : isRTL(children) ? 'right' : 'left', 
            maxWidth: '60%', 
            margin: '0 auto', 
            lineHeight: '1.5',
            direction: direction,
            width: centered ? '100%' : '50%',
        }}>
            {children}
        </div>
    );
}

export function Transition({ children }: { children: string }) {
    const direction = getTextDirection(children);
    const isRtl = direction === 'rtl';
    
    return (
        <div style={{ 
            textAlign: isRtl ? 'left' : 'right', 
            textTransform: 'uppercase', 
            marginTop: '1em',
            direction: direction
        }}>
            {children}
        </div>
    );
}

export function Subheader({ children }: { children: string }) {
    const direction = getTextDirection(children);
    const isRtl = direction === 'rtl';
    
    return (
        <span style={{ 
            textTransform: 'uppercase', 
            fontWeight: 'normal',
            marginLeft: isRtl ? '0' : '0.5em',
            marginRight: isRtl ? '0.5em' : '0',
            direction: direction
        }}>
            <strong>{children}</strong>
        </span>
    );
}