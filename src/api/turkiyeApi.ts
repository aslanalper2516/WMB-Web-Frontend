// TurkiyeAPI client
const BASE_URL = 'https://turkiyeapi.dev/api/v1';

export interface Province {
  id: number;
  name: string;
  region: string;
  plateCode: number;
}

export interface District {
  id: number;
  name: string;
  provinceId: number;
  province: {
    id: number;
    name: string;
  };
}

export interface Neighborhood {
  id: number;
  name: string;
  district: {
    id: number;
    name: string;
    province: {
      id: number;
      name: string;
    };
  };
}

export interface Village {
  id: number;
  name: string;
  district: {
    id: number;
    name: string;
    province: {
      id: number;
      name: string;
    };
  };
}

export const turkiyeApi = {
  // Tüm illeri getir
  getProvinces: async (): Promise<Province[]> => {
    const response = await fetch(`${BASE_URL}/provinces`);
    if (!response.ok) {
      throw new Error('İller yüklenirken hata oluştu');
    }
    const data = await response.json();
    return data.data || [];
  },

  // Belirli bir ile ait ilçeleri getir
  getDistrictsByProvince: async (provinceId: number): Promise<District[]> => {
    const response = await fetch(`${BASE_URL}/districts`);
    if (!response.ok) {
      throw new Error('İlçeler yüklenirken hata oluştu');
    }
    const data = await response.json();
    const allDistricts = data.data || [];
    return allDistricts.filter((district: any) => district.provinceId === provinceId);
  },

  // Belirli bir ilçeye ait mahalleleri getir
  getNeighborhoodsByDistrict: async (districtId: number): Promise<Neighborhood[]> => {
    const response = await fetch(`${BASE_URL}/neighborhoods`);
    if (!response.ok) {
      throw new Error('Mahalleler yüklenirken hata oluştu');
    }
    const data = await response.json();
    const allNeighborhoods = data.data || [];
    return allNeighborhoods.filter((neighborhood: any) => neighborhood.districtId === districtId);
  },

  // Belirli bir ilçeye ait köyleri getir
  getVillagesByDistrict: async (districtId: number): Promise<Village[]> => {
    const response = await fetch(`${BASE_URL}/villages`);
    if (!response.ok) {
      throw new Error('Köyler yüklenirken hata oluştu');
    }
    const data = await response.json();
    const allVillages = data.data || [];
    return allVillages.filter((village: any) => village.districtId === districtId);
  },
};
