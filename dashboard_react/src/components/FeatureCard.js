import React from 'react';
import PropTypes from 'prop-types';

const FeatureCard = ({ icon, title, description }) => {
    return (
        <div className="col col-md-4 mb-4">
            <div className="card feature-card">
                <div className="card-body">
                    <div className="feature-icon">
                        <i className={`bi ${icon}`}></i>
                    </div>
                    <h4 className="feature-title mt-3">{title}</h4>
                    <p className="text-secondary">{description}</p>
                </div>
            </div>
        </div>
    );
};

// PropTypes 检查
FeatureCard.propTypes = {
    icon: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
};

export default FeatureCard;