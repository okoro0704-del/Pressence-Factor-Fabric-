'use client';

import { type GlobalIdentity } from '@/lib/phoneIdentity';

interface FamilyTreeVisualizationProps {
  parent: GlobalIdentity;
  dependents: GlobalIdentity[];
  guardianPhone?: string;
}

export function FamilyTreeVisualization({ parent, dependents, guardianPhone }: FamilyTreeVisualizationProps) {
  const hasGuardian = !!guardianPhone;
  const hasDependents = dependents.length > 0;

  return (
    <div 
      className="rounded-xl border p-6"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        borderColor: 'rgba(212, 175, 55, 0.2)',
        boxShadow: '0 0 20px rgba(212, 175, 55, 0.05)'
      }}
    >
      <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-center" style={{ color: '#D4AF37' }}>
        Family Tree Structure
      </h3>

      <div className="flex flex-col items-center gap-6">
        {/* Guardian (if exists) */}
        {hasGuardian && (
          <>
            <PersonNode 
              name="Guardian (Architect)"
              phone={guardianPhone}
              type="guardian"
            />
            <TreeConnector direction="down" />
          </>
        )}

        {/* Parent/Current User */}
        <PersonNode 
          name={parent.full_name}
          phone={parent.phone_number}
          type={hasGuardian ? 'dependent' : 'parent'}
          accountType={parent.account_type}
        />

        {/* Dependents */}
        {hasDependents && (
          <>
            <TreeConnector direction="down" />
            <div className="flex items-start gap-8">
              {dependents.map((dependent, index) => (
                <div key={dependent.id} className="flex flex-col items-center">
                  {index > 0 && <TreeConnector direction="horizontal" />}
                  <PersonNode 
                    name={dependent.full_name}
                    phone={dependent.phone_number}
                    type="child"
                    accountType={dependent.account_type}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-[#2a2a2e] flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: '#D4AF37' }} />
          <span style={{ color: '#6b6b70' }}>Sovereign Operator</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: '#007FFF' }} />
          <span style={{ color: '#6b6b70' }}>Dependent</span>
        </div>
      </div>
    </div>
  );
}

// Person Node Component
function PersonNode({ 
  name, 
  phone, 
  type, 
  accountType 
}: { 
  name: string; 
  phone: string; 
  type: 'guardian' | 'parent' | 'dependent' | 'child';
  accountType?: string;
}) {
  const isDependent = accountType === 'DEPENDENT';
  const color = isDependent ? '#007FFF' : '#D4AF37';

  return (
    <div 
      className="rounded-lg border p-4 min-w-[200px]"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        borderColor: `${color}40`,
        boxShadow: `0 0 20px ${color}20`
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
            boxShadow: `0 0 15px ${color}40`
          }}
        >
          {type === 'guardian' ? '👑' : type === 'parent' ? '👤' : '👶'}
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color }}>
            {name}
          </p>
          <p className="text-xs" style={{ color: '#6b6b70' }}>
            {phone}
          </p>
        </div>
      </div>
      <div className="text-xs" style={{ color: '#4a4a4e' }}>
        {accountType === 'SOVEREIGN_OPERATOR' ? 'Full Access' : 'Managed Account'}
      </div>
    </div>
  );
}

// Tree Connector Component
function TreeConnector({ direction }: { direction: 'down' | 'horizontal' }) {
  if (direction === 'down') {
    return (
      <div className="flex flex-col items-center">
        <div 
          className="w-0.5 h-8"
          style={{ background: 'linear-gradient(180deg, #D4AF37 0%, #D4AF3740 100%)' }}
        />
        <div 
          className="w-2 h-2 rounded-full"
          style={{ background: '#D4AF37', boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)' }}
        />
      </div>
    );
  }

  return (
    <div 
      className="h-0.5 w-8"
      style={{ background: 'linear-gradient(90deg, #D4AF37 0%, #D4AF3740 100%)' }}
    />
  );
}

