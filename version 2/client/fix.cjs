const fs = require('fs');
let code = fs.readFileSync('src/components/ManagerDashboard.jsx', 'utf8');

// I need to add </div> after the first button in the main return statement.
// The button ends with:
// {showAddForm ? 'Cancel' : <><UserPlus className="w-4 h-4" /> Add Team Member</>}
// </button>

const search = `                >
                    {showAddForm ? 'Cancel' : <><UserPlus className="w-4 h-4" /> Add Team Member</>}
                </button>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>`;

const replace = `                >
                    {showAddForm ? 'Cancel' : <><UserPlus className="w-4 h-4" /> Add Team Member</>}
                </button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>`;

code = code.replace(search, replace);

// I also need to add a closing </div> at the end of the file since it was removed earlier.
// Wait, the backup might not have the </div> removed, because I took the backup BEFORE I removed it?
// Let's check what it ends with.
if (!code.endsWith('</div>\n    );\n}\n') && !code.endsWith('</div>\n    );\n}')) {
   // append it correctly
   code = code.replace(/    \);\n}\n*$/, '        </div>\n    );\n}\n');
}

fs.writeFileSync('src/components/ManagerDashboard.jsx', code);
