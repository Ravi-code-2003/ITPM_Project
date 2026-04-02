// Campus locations in Sri Lanka for distance calculation
module.exports = {
  campuses: [
    {
      id: 'uoc',
      name: 'University of Colombo',
      coordinates: [79.8612, 6.9015], // [longitude, latitude]
    },
    {
      id: 'uom',
      name: 'University of Moratuwa',
      coordinates: [79.9010, 6.7964],
    },
    {
      id: 'uop',
      name: 'University of Peradeniya',
      coordinates: [80.6034, 7.2574],
    },
    {
      id: 'uosj',
      name: 'University of Sri Jayewardenepura',
      coordinates: [79.9199, 6.8744],
    },
    {
      id: 'uok',
      name: 'University of Kelaniya',
      coordinates: [79.9214, 6.9678],
    },
    {
      id: 'uor',
      name: 'University of Ruhuna',
      coordinates: [80.1722, 6.0535],
    },
    {
      id: 'sliit',
      name: 'SLIIT - Malabe Campus',
      coordinates: [79.9733, 6.9147],
    },
    {
      id: 'nsbm',
      name: 'NSBM Green University',
      coordinates: [80.0385, 6.8203],
    },
  ],
  
  // Default campus (University of Colombo)
  default: {
    id: 'uoc',
    name: 'University of Colombo',
    coordinates: [79.8612, 6.9015],
  },
  
  getCampusById(id) {
    return this.campuses.find(campus => campus.id === id) || this.default;
  },
  
  getAllCampuses() {
    return this.campuses;
  },
};
