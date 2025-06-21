import React from 'react';
import './InventoryModal.css';

interface HouseObject {
  id: string;
  name: string;
  location: string;
  type: string;
  properties?: Record<string, string>;
}

interface HouseModalProps {
  houseObjects: HouseObject[];
}

const HouseModal: React.FC<HouseModalProps> = ({ houseObjects }) => {
  return (
    <div className="inventory-modal">
      {houseObjects.length === 0 ? (
        <div className="empty-state">
          <p>No house objects cataloged yet.</p>
          <p>Start a project to begin building your house inventory!</p>
        </div>
      ) : (
        <div className="inventory-grid">
          {houseObjects.map((obj) => (
            <div key={obj.id} className="inventory-item">
              <div className="item-icon">🏠</div>
              <div className="item-details">
                <h3 className="item-name">{obj.name}</h3>
                <p className="item-location">{obj.location}</p>
                <p className="item-type">{obj.type}</p>
                {obj.properties && Object.keys(obj.properties).length > 0 && (
                  <div className="item-properties">
                    {Object.entries(obj.properties).map(([key, value]) => (
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

export default HouseModal;