import { apiRequest } from '../client';

export const getCountries = () => apiRequest('/countries');

export const getStates = (countryId) => apiRequest(`/states/${countryId}`);

export const getCities = (stateId) => apiRequest(`/cities/${stateId}`);
