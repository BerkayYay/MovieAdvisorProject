// Main API Services Export
// Central hub for all API services

export * from './tmdbService';
export * from './omdbService';
export * from './backendApi';

export {tmdbService} from './tmdbService';
export {omdbService} from './omdbService';
export {backendService} from './backendApi';

import {tmdbService} from './tmdbService';
import {omdbService} from './omdbService';
import {backendService} from './backendApi';

export * from '../utils/dataTransformers';

export const apiServices = {
  tmdb: tmdbService,
  omdb: omdbService,
  backend: backendService,

  isFullyConfigured: () => {
    return (
      tmdbService.isConfigured() &&
      omdbService.isConfigured() &&
      backendService.isConfigured()
    );
  },

  getStatus: () => {
    return {
      tmdb: tmdbService.isConfigured(),
      omdb: omdbService.isConfigured(),
      backend: backendService.isConfigured(),
      ready:
        tmdbService.isConfigured() &&
        omdbService.isConfigured() &&
        backendService.isConfigured(),
    };
  },
};
