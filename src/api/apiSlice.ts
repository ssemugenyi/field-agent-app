import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';
import { upsertProperties, upsertPropertyDetail } from '../db/properties.repo';
import type {
  LoginResponse,
  PropertiesListResponse,
  PropertyDetailApi,
  InspectionSubmitRequest,
  InspectionSubmitResponse,
  InspectionsListResponse,
  PhotoUploadResponse,
  Region,
  PropertyStatus,
} from '../types/api';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),

    getProperties: builder.query<
      PropertiesListResponse,
      { cursor?: string; limit?: number; q?: string; region?: Region; status?: PropertyStatus }
    >({
      query: (params) => ({ url: '/properties', params: params as Record<string, string | number | undefined> }),
      async onQueryStarted(_args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await upsertProperties(data.data);
        } catch {

        }
      },
    }),

    getPropertyDetail: builder.query<PropertyDetailApi, string>({
      query: (id) => ({ url: `/properties/${id}` }),
      async onQueryStarted(_id, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await upsertPropertyDetail(data);
        } catch {

        }
      },
    }),

    postInspection: builder.mutation<
      InspectionSubmitResponse,
      { body: InspectionSubmitRequest; idempotencyKey: string }
    >({
      query: ({ body, idempotencyKey }) => ({
        url: '/inspections',
        method: 'POST',
        body,
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
    }),

    getInspections: builder.query<InspectionsListResponse, { agentId?: string; cursor?: string; limit?: number }>({
      query: (params) => ({ url: '/inspections', params: params as Record<string, string | number | undefined> }),
    }),

    postPhoto: builder.mutation<PhotoUploadResponse, FormData>({
      query: (formData) => ({ url: '/photos', method: 'POST', formData }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetPropertiesQuery,
  useLazyGetPropertiesQuery,
  useGetPropertyDetailQuery,
  useGetInspectionsQuery,
} = api;
