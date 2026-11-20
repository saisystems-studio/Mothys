// src/services/companyService.js
import api from './api';

export const EMPTY_COMPANY = {
  name: '',
  address: '',
  email: '',
  phone: '',
  logo: '',
  signature: '',
  updated_at: null,
};

// In-memory copy of the last profile fetched/saved, so PDF code can read it
// synchronously after the app (or the PDF function) has called getCompanyProfile().
let cache = null;

/** Returns { name, address, email, phone, logo, signature, updated_at }.
 *  logo / signature are base64 data URLs, or "" if not set. */
export async function getCompanyProfile() {
  const { data } = await api.get('/company-profile');
  cache = { ...EMPTY_COMPANY, ...data };
  return cache;
}

/** Admin only. `data` = { name, address, email, phone, logo?, signature? }
 *  logo/signature: data URL = replace, "" = remove, omitted = keep as is. */
export async function saveCompanyProfile(data) {
  const res = await api.put('/company-profile', data);
  cache = { ...EMPTY_COMPANY, ...res.data };
  return cache;
}

/** Last loaded/saved profile (or EMPTY_COMPANY if nothing was loaded yet). */
export function getCachedCompanyProfile() {
  return cache ?? EMPTY_COMPANY;
}

/** Turns a failed save into { field: message } for showing under form inputs.
 *  e.g. { phone: "Phone number is required." }  (key "_form" = general error) */
export function getCompanyErrors(err) {
  const detail = err?.response?.data?.detail;
  if (detail && typeof detail === 'object' && detail.errors) return detail.errors;
  if (typeof detail === 'string') return { _form: detail };
  return { _form: 'Something went wrong. Please try again.' };
}

/** Helper for <input type="file">: reads a File into a base64 data URL. */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}
