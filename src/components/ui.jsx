import React, { useEffect, useRef } from 'react';
import * as I from '../icons';
const cn=(...a)=>a.filter(Boolean).join(' ');

export function Brand({dark=false}){return <div className={cn("brand","image-brand",dark&&"dark")}><span className="logo-window"><img src="/assets/nexa-logo.png" alt="NEXA"/></span></div>}

export function IconButton({icon:Icon,label,...props}){return <button className="icon-btn" aria-label={label} title={label} {...props}><Icon size={19}/></button>}

export function Field({label,children,...props}){return <label className="field"><span>{label}</span>{children||<input {...props}/>}</label>}

export function Modal({title,children,onClose,wide=false,className=''}){const ref=useRef();useEffect(()=>{const old=document.activeElement,prev=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.querySelector('input,select,button')?.focus();const handler=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const els=ref.current.querySelectorAll('button:not(:disabled),input,select,textarea,a[href]'),first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};document.addEventListener('keydown',handler);return()=>{document.body.style.overflow=prev;document.removeEventListener('keydown',handler);old?.focus?.();};},[]);return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section ref={ref} className={cn('modal',wide&&'wide',className)} role="dialog" aria-modal="true" aria-label={title}><div className="modal-heading"><h2>{title}</h2><IconButton icon={I.X} label="Cerrar ventana" onClick={onClose}/></div>{children}</section></div>}
