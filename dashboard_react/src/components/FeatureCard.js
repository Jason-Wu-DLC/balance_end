import React from 'react';
import PropTypes from 'prop-types';

const FeatureCard = ({ icon, title, description }) => {
    return (
        <div className="col-md-4 mb-4">
            <div className="feature-icon">
                <i className={`bi ${icon}`}></i>
            </div>
            <h4 className="mt-3">{title}</h4>
            <p className="text-muted">{description}</p>
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
