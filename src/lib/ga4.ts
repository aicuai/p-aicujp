import { BetaAnalyticsDataClient } from "@google-analytics/data"

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID
const GA4_CREDENTIALS_BASE64 = process.env.GA4_CREDENTIALS_BASE64

let _client: BetaAnalyticsDataClient | null = null

function getClient(): BetaAnalyticsDataClient {
  if (_client) return _client

  if (!GA4_CREDENTIALS_BASE64) {
    throw new Error("GA4_CREDENTIALS_BASE64 is not configured")
  }

  const credentialsJson = Buffer.from(GA4_CREDENTIALS_BASE64, "base64").toString("utf-8")
  const credentials = JSON.parse(credentialsJson)

  _client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    projectId: credentials.project_id,
  })
  return _client
}

export function isGA4Configured(): boolean {
  return !!(GA4_PROPERTY_ID && GA4_CREDENTIALS_BASE64)
}

function daysAgoDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

// --- Overview metrics (users, sessions, pageviews, bounce rate, avg session duration) ---

export type GA4Overview = {
  users7d: number
  sessions7d: number
  pageviews7d: number
  bounceRate7d: number
  avgSessionDuration7d: number
  users30d: number
  sessions30d: number
  pageviews30d: number
  bounceRate30d: number
  avgSessionDuration30d: number
}

async function fetchMetrics(days: number) {
  const client = getClient()
  const [response] = await client.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "bounceRate" },
      { name: "averageSessionDuration" },
    ],
  })
  const row = response.rows?.[0]
  if (!row?.metricValues) return { users: 0, sessions: 0, pageviews: 0, bounceRate: 0, avgSessionDuration: 0 }
  return {
    users: Number(row.metricValues[0]?.value ?? 0),
    sessions: Number(row.metricValues[1]?.value ?? 0),
    pageviews: Number(row.metricValues[2]?.value ?? 0),
    bounceRate: Math.round(Number(row.metricValues[3]?.value ?? 0) * 1000) / 10,
    avgSessionDuration: Math.round(Number(row.metricValues[4]?.value ?? 0)),
  }
}

export async function getGA4Overview(): Promise<GA4Overview> {
  const [m7, m30] = await Promise.all([fetchMetrics(7), fetchMetrics(30)])
  return {
    users7d: m7.users,
    sessions7d: m7.sessions,
    pageviews7d: m7.pageviews,
    bounceRate7d: m7.bounceRate,
    avgSessionDuration7d: m7.avgSessionDuration,
    users30d: m30.users,
    sessions30d: m30.sessions,
    pageviews30d: m30.pageviews,
    bounceRate30d: m30.bounceRate,
    avgSessionDuration30d: m30.avgSessionDuration,
  }
}

// --- Daily trend (users + pageviews per day) ---

export type GA4DailyData = {
  date: string
  users: number
  pageviews: number
}

export async function getGA4DailyTrend(days: number = 30): Promise<GA4DailyData[]> {
  const client = getClient()
  const [response] = await client.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "activeUsers" },
      { name: "screenPageViews" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  })

  return (response.rows ?? []).map((row) => ({
    date: row.dimensionValues?.[0]?.value ?? "",
    users: Number(row.metricValues?.[0]?.value ?? 0),
    pageviews: Number(row.metricValues?.[1]?.value ?? 0),
  }))
}

// --- Top pages ---

export type GA4PageData = {
  hostname: string
  path: string
  title: string
  pageviews: number
  users: number
}

export async function getGA4TopPages(days: number = 30, limit: number = 20): Promise<GA4PageData[]> {
  const client = getClient()
  const [response] = await client.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [
      { name: "hostName" },
      { name: "pagePath" },
      { name: "pageTitle" },
    ],
    metrics: [
      { name: "screenPageViews" },
      { name: "activeUsers" },
    ],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit,
  })

  return (response.rows ?? []).map((row) => ({
    hostname: row.dimensionValues?.[0]?.value ?? "",
    path: row.dimensionValues?.[1]?.value ?? "",
    title: row.dimensionValues?.[2]?.value ?? "",
    pageviews: Number(row.metricValues?.[0]?.value ?? 0),
    users: Number(row.metricValues?.[1]?.value ?? 0),
  }))
}

// --- Traffic sources ---

export type GA4SourceData = {
  source: string
  medium: string
  sessions: number
  users: number
}

export async function getGA4TrafficSources(days: number = 30, limit: number = 15): Promise<GA4SourceData[]> {
  const client = getClient()
  const [response] = await client.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [
      { name: "sessionSource" },
      { name: "sessionMedium" },
    ],
    metrics: [
      { name: "sessions" },
      { name: "activeUsers" },
    ],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit,
  })

  return (response.rows ?? []).map((row) => ({
    source: row.dimensionValues?.[0]?.value ?? "(not set)",
    medium: row.dimensionValues?.[1]?.value ?? "(not set)",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
    users: Number(row.metricValues?.[1]?.value ?? 0),
  }))
}

// --- Data streams breakdown ---

// Known stream ID → URL mapping (from GA4 Admin API)
const STREAM_URLS: Record<string, string> = {
  "10401142105": "www.aicu.blog",
  "12088235980": "drawing.aicu.jp",
  "13038509086": "u.aicu.jp",
  "13238148560": "oshi.aicu.jp",
  "13590341306": "aicu.jp",
}

export type GA4StreamData = {
  streamName: string
  streamId: string
  url: string
  sessions: number
  users: number
}

export async function getGA4DataStreams(days: number = 30): Promise<GA4StreamData[]> {
  const client = getClient()
  const [response] = await client.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [
      { name: "streamName" },
      { name: "streamId" },
    ],
    metrics: [
      { name: "sessions" },
      { name: "activeUsers" },
    ],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  })

  return (response.rows ?? []).map((row) => {
    const streamId = row.dimensionValues?.[1]?.value ?? ""
    return {
      streamName: row.dimensionValues?.[0]?.value ?? "",
      streamId,
      url: STREAM_URLS[streamId] ?? "",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
      users: Number(row.metricValues?.[1]?.value ?? 0),
    }
  })
}
