import React, { useState } from 'react';
import { Key, Link2 } from 'lucide-react';
import { Modal, Loading, useFetch } from './ui';

// Entity list generated live from PRAGMA table_info / foreign_key_list, so the diagram can
// never drift from the actual schema. Selecting an entity highlights every table it
// references and every table that references it.
export default function ERDiagramModal({ isOpen, onClose }) {
    if (!isOpen) return null;
    return <ERDiagram onClose={onClose} />;
}

function ERDiagram({ onClose }) {
    const { data: tables, loading } = useFetch('/api/tables', []);
    const [selected, setSelected] = useState(null);

    const sel = tables.find(t => t.name === selected);
    const outgoing = new Set(sel ? sel.foreignKeys.map(fk => fk.table) : []);
    const incoming = new Set(tables.filter(t => t.foreignKeys.some(fk => fk.table === selected)).map(t => t.name));
    const fkCount = tables.reduce((s, t) => s + t.foreignKeys.length, 0);

    return (
        <Modal
            title="Entity–relationship schema"
            subtitle={`${tables.length} tables · ${fkCount} foreign keys · click an entity to trace its relationships`}
            onClose={onClose}
            size="xl"
        >
            <div className="modal-body">
                {loading ? <Loading /> : (
                    <div className="stack">
                        {sel && (
                            <div className="alert tone-primary text-sm">
                                <div>
                                    <strong className="mono">{sel.name}</strong> references {outgoing.size ? [...outgoing].map(t => <code key={t} style={{ marginRight: 4 }}>{t}</code>) : 'nothing'}
                                    {' '}· referenced by {incoming.size ? [...incoming].map(t => <code key={t} style={{ marginRight: 4 }}>{t}</code>) : 'nothing'}
                                </div>
                            </div>
                        )}
                        <div className="er-grid">
                            {tables.map(t => {
                                const fkCols = Object.fromEntries(t.foreignKeys.map(fk => [fk.from, fk]));
                                const cls = t.name === selected ? 'active' : (outgoing.has(t.name) || incoming.has(t.name)) ? 'related' : '';
                                return (
                                    <button key={t.name} className={`er-entity ${cls}`} onClick={() => setSelected(t.name === selected ? null : t.name)} style={{ opacity: selected && !cls ? 0.45 : 1 }}>
                                        <div className="er-entity-head"><span>{t.name}</span><span className="light">{t.rowCount}</span></div>
                                        <div className="er-entity-body">
                                            {t.columns.map(c => (
                                                <div key={c.name} className="row-between" style={{ gap: 6 }}>
                                                    <span className="row" style={{ gap: 4, color: c.pk ? 'var(--text-main)' : undefined, fontWeight: c.pk ? 600 : 400 }}>
                                                        {c.pk ? <Key size={10} className="text-warning" /> : fkCols[c.name] ? <Link2 size={10} style={{ color: 'var(--info)' }} /> : <span style={{ width: 10 }} />}
                                                        {c.name}
                                                    </span>
                                                    <span className="light truncate" style={{ maxWidth: 110 }}>{fkCols[c.name] ? `→ ${fkCols[c.name].table}` : c.type.toLowerCase()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="row wrap text-xs muted" style={{ gap: '1rem' }}>
                            <span className="row" style={{ gap: 4 }}><Key size={11} className="text-warning" /> primary key</span>
                            <span className="row" style={{ gap: 4 }}><Link2 size={11} style={{ color: 'var(--info)' }} /> foreign key</span>
                            <span>Row counts are live.</span>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
