import client from './client';

export const getAllVideos = () => client.get('/v1/gurukul/videos');
export const getVideoById = (id) => client.get(`/v1/gurukul/videos/${id}`);
export const getSectionsByVideo = (videoId) => client.get(`/v1/gurukul/videos/${videoId}/sections`);
export const getSubsectionsBySection = (sectionId) => client.get(`/v1/gurukul/sections/${sectionId}/subsections`);
