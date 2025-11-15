/**
 * Scoring Rubric Configuration
 * Defines how jobs are scored across different components
 */

const RUBRIC = {
    title: {
        max: 30,
        priorityTitles: [
            'CPG Sales Manager',
            'Ecommerce Manager',
            'E-commerce Manager',
            'Procurement Manager',
            'Key Account Manager',
            'Channel Sales Manager',
            'Business Development Manager',
        ],
        exactMatch: 30,
        partialMatch: 15,
    },
    skills: {
        max: 25,
        keywords: [
            'shopify',
            'ecommerce',
            'e-commerce',
            'procurement',
            'sourcing',
            'cpg',
            'consumer packaged goods',
            'dtc',
            'direct to consumer',
            'marketplace',
            'sales',
            'channel',
            'distribution',
            'retail',
            'grocery',
            'broker',
        ],
        pointsPerMatch: 3,
    },
    location: {
        max: 20,
        remote: 20,
        charlotte: 15,
        charlotteZip: '28213',
        charlotteRadius: 25, // miles
    },
    recency: {
        max: 15,
        days7: 15,
        days14: 10,
        days30: 5,
    },
    companyFit: {
        max: 10,
        cpgKeywords: ['cpg', 'consumer packaged goods', 'food', 'beverage'],
        dtcKeywords: ['dtc', 'direct to consumer', 'ecommerce', 'online'],
        points: 10,
    },
};

module.exports = RUBRIC;

