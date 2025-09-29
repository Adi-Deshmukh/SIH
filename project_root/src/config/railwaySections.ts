// Railway Section Configuration for Section-Based Authentication and Map Filtering
export interface RailwaySection {
  id: string;
  name: string;
  displayName: string;
  description: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  stations: string[];
  majorStations: string[];
  credentials: {
    username: string;
    password: string;
  };
}

export const RAILWAY_SECTIONS: Record<string, RailwaySection> = {
  'bangalore-mysuru': {
    id: 'bangalore-mysuru',
    name: 'Bangalore-Mysuru Section',
    displayName: 'KSR Bengaluru - Mysuru Section',
    description: 'South Western Railway section covering Bangalore to Mysuru route',
    bounds: {
      north: 13.1000,
      south: 12.1000,
      east: 77.8000,
      west: 76.4000
    },
    center: {
      lat: 12.6000,
      lng: 77.1000
    },
    zoom: 9,
    stations: [
      'KSR Bengaluru (SBC)',
      'Kengeri (KGI)',
      'Bidadi (BID)', 
      'Ramanagara (RMG)',
      'Channapatna (CPT)',
      'Maddur (MAD)',
      'Mandya (MYA)',
      'Pandavapura (PAN)',
      'Srirangapatna (SRGP)',
      'Mysuru Jn (MYS)'
    ],
    majorStations: ['KSR Bengaluru (SBC)', 'Ramanagara (RMG)', 'Mandya (MYA)', 'Mysuru Jn (MYS)'],
    credentials: {
      username: 'stationmaster01',
      password: 'password123'
    }
  },

  'chennai-central': {
    id: 'chennai-central',
    name: 'Chennai Central Section',
    displayName: 'Chennai Metropolitan Section',
    description: 'Southern Railway Chennai division covering metropolitan area',
    bounds: {
      north: 13.3000,
      south: 12.5000,
      east: 80.5000,
      west: 79.5000
    },
    center: {
      lat: 13.0878,
      lng: 80.2785
    },
    zoom: 10,
    stations: [
      'Chennai Central (MAS)',
      'Chennai Egmore (MS)',
      'Chennai Park (MPK)',
      'Tambaram (TBM)',
      'Chromepet (CMP)',
      'Pallavaram (PZA)',
      'Tirusulam (TSM)',
      'Chengalpattu (CGL)',
      'Melmaruvathur (MLM)',
      'Villupuram (VM)'
    ],
    majorStations: ['Chennai Central (MAS)', 'Chennai Egmore (MS)', 'Tambaram (TBM)', 'Chengalpattu (CGL)'],
    credentials: {
      username: 'controller01',
      password: 'railway123'
    }
  },

  'mumbai-western': {
    id: 'mumbai-western',
    name: 'Mumbai Western Section', 
    displayName: 'Mumbai Western Railway Section',
    description: 'Western Railway Mumbai division covering western suburban lines',
    bounds: {
      north: 19.4000,
      south: 18.8000,
      east: 73.2000,
      west: 72.6000
    },
    center: {
      lat: 19.0760,
      lng: 72.8777
    },
    zoom: 11,
    stations: [
      'Mumbai Central (MMCT)',
      'Mahalakshmi (MX)',
      'Lower Parel (LPR)',
      'Elphinstone Road (EL)',
      'Dadar (DR)',
      'Bandra (BA)',
      'Khar Road (KHR)',
      'Andheri (ADH)',
      'Jogeshwari (JOS)',
      'Borivali (BVI)'
    ],
    majorStations: ['Mumbai Central (MMCT)', 'Dadar (DR)', 'Bandra (BA)', 'Andheri (ADH)'],
    credentials: {
      username: 'mumbai01',
      password: 'western123'
    }
  },

  'delhi-ncr': {
    id: 'delhi-ncr',
    name: 'Delhi NCR Section',
    displayName: 'Delhi National Capital Region',
    description: 'Northern Railway Delhi division covering NCR area',
    bounds: {
      north: 28.9000,
      south: 28.3000,
      east: 77.6000,
      west: 76.8000
    },
    center: {
      lat: 28.6139,
      lng: 77.2090
    },
    zoom: 10,
    stations: [
      'New Delhi (NDLS)',
      'Old Delhi (DLI)',
      'Delhi Sarai Rohilla (DEE)',
      'Delhi Cantonment (DEC)',
      'Nizamuddin (NZM)',
      'Anand Vihar (ANVT)',
      'Ghaziabad (GZB)',
      'Faridabad (FDB)',
      'Gurgaon (GGN)',
      'Rohtak (ROK)'
    ],
    majorStations: ['New Delhi (NDLS)', 'Old Delhi (DLI)', 'Ghaziabad (GZB)', 'Gurgaon (GGN)'],
    credentials: {
      username: 'delhi01',
      password: 'ncr123'
    }
  }
};

// Helper functions for section management
export const getSectionById = (sectionId: string): RailwaySection | undefined => {
  return RAILWAY_SECTIONS[sectionId];
};

export const getSectionByCredentials = (username: string, password: string): RailwaySection | undefined => {
  return Object.values(RAILWAY_SECTIONS).find(section => 
    section.credentials.username === username && section.credentials.password === password
  );
};

export const getAllSections = (): RailwaySection[] => {
  return Object.values(RAILWAY_SECTIONS);
};

export const getSectionStations = (sectionId: string): string[] => {
  const section = getSectionById(sectionId);
  return section ? section.stations : [];
};

export const getSectionBounds = (sectionId: string) => {
  const section = getSectionById(sectionId);
  return section ? section.bounds : null;
};

export const getSectionCenter = (sectionId: string) => {
  const section = getSectionById(sectionId);
  return section ? section.center : null;
};