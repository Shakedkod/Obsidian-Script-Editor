import React from 'react';
import "../../styles.css";

// Helper function to detect RTL text
function isRTL(text: string): boolean {
    const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlRegex.test(text);
}

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

export function Character({ children }: { children: string }) {
    const direction = getTextDirection(children);
    
    return (
        <div style={{ 
            textAlign: 'center', 
            textTransform: 'uppercase', 
            marginTop: '1em',
            direction: direction,
            fontSize: '1.2em',
            fontWeight: 'bold',
        }}>
            <strong>{children}</strong>
        </div>
    );
}

export function Dialogue({ children }: { children: string }) {
    const direction = getTextDirection(children);
    
    return (
        <div style={{ 
            textAlign: 'center', 
            maxWidth: '60%', 
            margin: '0 auto', 
            lineHeight: '1.5',
            direction: direction
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
            <strong>({children})</strong>
        </span>
    );
}

// New combined component for when header and subheader should be on same line
export function SceneHeadingWithSubheader({ heading, subheader }: { heading: string; subheader: string }) {
    const headingDirection = getTextDirection(heading);
    const subheaderDirection = getTextDirection(subheader);
    const isHeadingRtl = headingDirection === 'rtl';
    const isSubheaderRtl = subheaderDirection === 'rtl';
    
    // If both are RTL or both are LTR, use the same direction
    // If mixed, prioritize the heading direction
    const containerDirection = headingDirection;
    const isContainerRtl = isHeadingRtl;
    
    return (
        <div style={{ 
            fontWeight: 'bold', 
            textTransform: 'uppercase', 
            marginTop: '1em', 
            marginBottom: "1em",
            direction: containerDirection,
            textAlign: isContainerRtl ? 'right' : 'left'
        }}>
            {isContainerRtl ? (
                // RTL: subheader first, then heading
                <>
                    <span style={{ 
                        fontWeight: 'normal',
                        marginLeft: '0.5em',
                        direction: subheaderDirection
                    }}>
                        <strong>({subheader})</strong>
                    </span>
                    <span style={{ direction: headingDirection }}>
                        {heading}
                    </span>
                </>
            ) : (
                // LTR: heading first, then subheader
                <>
                    <span style={{ direction: headingDirection }}>
                        {heading}
                    </span>
                    <span style={{ 
                        fontWeight: 'normal',
                        marginLeft: '0.5em',
                        direction: subheaderDirection
                    }}>
                        <strong>({subheader})</strong>
                    </span>
                </>
            )}
        </div>
    );
}