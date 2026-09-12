/**
 * Service quản lý danh sách Tỉnh/Thành phố Việt Nam
 * Sử dụng API v2 mới nhất (Sau sáp nhập tỉnh thành): https://provinces.open-api.vn/api/v2/
 */

const API_V2_URL = 'https://provinces.open-api.vn/api/v2/';
const STORAGE_KEY = 'vn_provinces_v2';

export const cleanProvinceName = (name = '') => {
  if (!name) return '';
  return name.replace(/^(Thành phố|Tỉnh)\s+/i, '').trim();
};

// Dữ liệu dự phòng 34 tỉnh/thành phố chuẩn mới theo API v2 phòng khi mất kết nối mạng
export const FALLBACK_PROVINCES = [
  { code: 1, name: "Thành phố Hà Nội", cleanName: "Hà Nội", division_type: "thành phố trung ương" },
  { code: 4, name: "Tỉnh Cao Bằng", cleanName: "Cao Bằng", division_type: "tỉnh" },
  { code: 8, name: "Tỉnh Tuyên Quang", cleanName: "Tuyên Quang", division_type: "tỉnh" },
  { code: 11, name: "Tỉnh Điện Biên", cleanName: "Điện Biên", division_type: "tỉnh" },
  { code: 12, name: "Tỉnh Lai Châu", cleanName: "Lai Châu", division_type: "tỉnh" },
  { code: 14, name: "Tỉnh Sơn La", cleanName: "Sơn La", division_type: "tỉnh" },
  { code: 15, name: "Tỉnh Lào Cai", cleanName: "Lào Cai", division_type: "tỉnh" },
  { code: 19, name: "Tỉnh Thái Nguyên", cleanName: "Thái Nguyên", division_type: "tỉnh" },
  { code: 20, name: "Tỉnh Lạng Sơn", cleanName: "Lạng Sơn", division_type: "tỉnh" },
  { code: 22, name: "Tỉnh Quảng Ninh", cleanName: "Quảng Ninh", division_type: "tỉnh" },
  { code: 24, name: "Tỉnh Bắc Ninh", cleanName: "Bắc Ninh", division_type: "tỉnh" },
  { code: 25, name: "Tỉnh Phú Thọ", cleanName: "Phú Thọ", division_type: "tỉnh" },
  { code: 31, name: "Thành phố Hải Phòng", cleanName: "Hải Phòng", division_type: "thành phố trung ương" },
  { code: 33, name: "Tỉnh Hưng Yên", cleanName: "Hưng Yên", division_type: "tỉnh" },
  { code: 37, name: "Tỉnh Ninh Bình", cleanName: "Ninh Bình", division_type: "tỉnh" },
  { code: 38, name: "Tỉnh Thanh Hóa", cleanName: "Thanh Hóa", division_type: "tỉnh" },
  { code: 40, name: "Tỉnh Nghệ An", cleanName: "Nghệ An", division_type: "tỉnh" },
  { code: 42, name: "Tỉnh Hà Tĩnh", cleanName: "Hà Tĩnh", division_type: "tỉnh" },
  { code: 44, name: "Tỉnh Quảng Trị", cleanName: "Quảng Trị", division_type: "tỉnh" },
  { code: 46, name: "Thành phố Huế", cleanName: "Huế", division_type: "thành phố trung ương" },
  { code: 48, name: "Thành phố Đà Nẵng", cleanName: "Đà Nẵng", division_type: "thành phố trung ương" },
  { code: 51, name: "Tỉnh Quảng Ngãi", cleanName: "Quảng Ngãi", division_type: "tỉnh" },
  { code: 52, name: "Tỉnh Gia Lai", cleanName: "Gia Lai", division_type: "tỉnh" },
  { code: 56, name: "Tỉnh Khánh Hòa", cleanName: "Khánh Hòa", division_type: "tỉnh" },
  { code: 66, name: "Tỉnh Đắk Lắk", cleanName: "Đắk Lắk", division_type: "tỉnh" },
  { code: 68, name: "Tỉnh Lâm Đồng", cleanName: "Lâm Đồng", division_type: "tỉnh" },
  { code: 75, name: "Tỉnh Đồng Nai", cleanName: "Đồng Nai", division_type: "tỉnh" },
  { code: 79, name: "Thành phố Hồ Chí Minh", cleanName: "Hồ Chí Minh", division_type: "thành phố trung ương" },
  { code: 80, name: "Tỉnh Tây Ninh", cleanName: "Tây Ninh", division_type: "tỉnh" },
  { code: 82, name: "Tỉnh Đồng Tháp", cleanName: "Đồng Tháp", division_type: "tỉnh" },
  { code: 86, name: "Tỉnh Vĩnh Long", cleanName: "Vĩnh Long", division_type: "tỉnh" },
  { code: 91, name: "Tỉnh An Giang", cleanName: "An Giang", division_type: "tỉnh" },
  { code: 92, name: "Thành phố Cần Thơ", cleanName: "Cần Thơ", division_type: "thành phố trung ương" },
  { code: 96, name: "Tỉnh Cà Mau", cleanName: "Cà Mau", division_type: "tỉnh" }
];

let cachedProvinces = null;

/**
 * Lấy danh sách Tỉnh/Thành phố từ API v2 mới
 * Có cache in-memory và sessionStorage
 */
export const fetchProvinces = async () => {
  if (cachedProvinces && cachedProvinces.length > 0) {
    return cachedProvinces;
  }

  try {
    const sessionData = sessionStorage.getItem(STORAGE_KEY);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedProvinces = parsed;
        return cachedProvinces;
      }
    }
  } catch (e) {
    // sessionStorage không khả dụng hoặc parse lỗi
  }

  try {
    const response = await fetch(API_V2_URL);
    if (!response.ok) {
      throw new Error(`Location API response status: ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const formatted = data.map((item) => ({
        code: item.code,
        name: item.name,
        cleanName: cleanProvinceName(item.name),
        division_type: item.division_type,
        codename: item.codename
      }));
      cachedProvinces = formatted;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
      } catch (e) {}
      return formatted;
    }
  } catch (error) {
    console.warn('Không thể nạp dữ liệu từ API địa điểm mới (v2), kích hoạt dữ liệu dự phòng:', error);
  }

  cachedProvinces = FALLBACK_PROVINCES;
  return FALLBACK_PROVINCES;
};

export default {
  fetchProvinces,
  cleanProvinceName,
  FALLBACK_PROVINCES
};
