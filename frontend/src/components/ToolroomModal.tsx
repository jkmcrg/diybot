import React from 'react';
import './InventoryModal.css';

interface Tool {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: 'working' | 'broken' | 'needs_maintenance';
  iconKeywords?: string[];
  properties?: Record<string, string>;
}

interface ToolroomModalProps {
  tools: Tool[];
  onRefresh?: () => void;
}

const ToolroomModal: React.FC<ToolroomModalProps> = ({ tools, onRefresh }) => {
  const getConditionColor = (condition: Tool['condition']) => {
    switch (condition) {
      case 'working': return '#28a745';
      case 'broken': return '#dc3545';
      case 'needs_maintenance': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getConditionLabel = (condition: Tool['condition']) => {
    switch (condition) {
      case 'working': return 'Working';
      case 'broken': return 'Broken';
      case 'needs_maintenance': return 'Needs Maintenance';
      default: return 'Unknown';
    }
  };

  return (
    <div className="inventory-modal">
      {onRefresh && (
        <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
          <button 
            onClick={onRefresh}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      )}
      {tools.length === 0 ? (
        <div className="empty-state">
          <p>No tools in your toolroom yet.</p>
          <p>Start a project and let the AI discover your tools!</p>
        </div>
      ) : (
        <div className="inventory-grid">
          {tools.map((tool) => (
            <div key={tool.id} className="inventory-item">
              <div className="item-icon">🔧</div>
              <div className="item-details">
                <h3 className="item-name">{tool.name}</h3>
                <p className="item-category">{tool.category}</p>
                <div className="item-stats">
                  <span className="quantity">Qty: {tool.quantity}</span>
                  <span 
                    className="condition"
                    style={{ color: getConditionColor(tool.condition) }}
                  >
                    {getConditionLabel(tool.condition)}
                  </span>
                </div>
                {tool.properties && Object.keys(tool.properties).length > 0 && (
                  <div className="item-properties">
                    {Object.entries(tool.properties).map(([key, value]) => (
                      <span key={key} className="property-tag">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolroomModal;