/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as LoginImport } from './routes/login'
import { Route as MainImport } from './routes/_main'
import { Route as IndexImport } from './routes/index'
import { Route as MainSessionsImport } from './routes/_main/sessions'
import { Route as MainDocsImport } from './routes/_main/docs'
import { Route as MainReciteDocIdImport } from './routes/_main/recite.$docId'

// Create/Update Routes

const LoginRoute = LoginImport.update({
  path: '/login',
  getParentRoute: () => rootRoute,
} as any)

const MainRoute = MainImport.update({
  id: '/_main',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const MainSessionsRoute = MainSessionsImport.update({
  path: '/sessions',
  getParentRoute: () => MainRoute,
} as any)

const MainDocsRoute = MainDocsImport.update({
  path: '/docs',
  getParentRoute: () => MainRoute,
} as any)

const MainReciteDocIdRoute = MainReciteDocIdImport.update({
  path: '/recite/$docId',
  getParentRoute: () => MainRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/_main': {
      id: '/_main'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof MainImport
      parentRoute: typeof rootRoute
    }
    '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginImport
      parentRoute: typeof rootRoute
    }
    '/_main/docs': {
      id: '/_main/docs'
      path: '/docs'
      fullPath: '/docs'
      preLoaderRoute: typeof MainDocsImport
      parentRoute: typeof MainImport
    }
    '/_main/sessions': {
      id: '/_main/sessions'
      path: '/sessions'
      fullPath: '/sessions'
      preLoaderRoute: typeof MainSessionsImport
      parentRoute: typeof MainImport
    }
    '/_main/recite/$docId': {
      id: '/_main/recite/$docId'
      path: '/recite/$docId'
      fullPath: '/recite/$docId'
      preLoaderRoute: typeof MainReciteDocIdImport
      parentRoute: typeof MainImport
    }
  }
}

// Create and export the route tree

interface MainRouteChildren {
  MainDocsRoute: typeof MainDocsRoute
  MainSessionsRoute: typeof MainSessionsRoute
  MainReciteDocIdRoute: typeof MainReciteDocIdRoute
}

const MainRouteChildren: MainRouteChildren = {
  MainDocsRoute: MainDocsRoute,
  MainSessionsRoute: MainSessionsRoute,
  MainReciteDocIdRoute: MainReciteDocIdRoute,
}

const MainRouteWithChildren = MainRoute._addFileChildren(MainRouteChildren)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '': typeof MainRouteWithChildren
  '/login': typeof LoginRoute
  '/docs': typeof MainDocsRoute
  '/sessions': typeof MainSessionsRoute
  '/recite/$docId': typeof MainReciteDocIdRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '': typeof MainRouteWithChildren
  '/login': typeof LoginRoute
  '/docs': typeof MainDocsRoute
  '/sessions': typeof MainSessionsRoute
  '/recite/$docId': typeof MainReciteDocIdRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/_main': typeof MainRouteWithChildren
  '/login': typeof LoginRoute
  '/_main/docs': typeof MainDocsRoute
  '/_main/sessions': typeof MainSessionsRoute
  '/_main/recite/$docId': typeof MainReciteDocIdRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '' | '/login' | '/docs' | '/sessions' | '/recite/$docId'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '' | '/login' | '/docs' | '/sessions' | '/recite/$docId'
  id:
    | '__root__'
    | '/'
    | '/_main'
    | '/login'
    | '/_main/docs'
    | '/_main/sessions'
    | '/_main/recite/$docId'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  MainRoute: typeof MainRouteWithChildren
  LoginRoute: typeof LoginRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  MainRoute: MainRouteWithChildren,
  LoginRoute: LoginRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/_main",
        "/login"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/_main": {
      "filePath": "_main.tsx",
      "children": [
        "/_main/docs",
        "/_main/sessions",
        "/_main/recite/$docId"
      ]
    },
    "/login": {
      "filePath": "login.tsx"
    },
    "/_main/docs": {
      "filePath": "_main/docs.tsx",
      "parent": "/_main"
    },
    "/_main/sessions": {
      "filePath": "_main/sessions.tsx",
      "parent": "/_main"
    },
    "/_main/recite/$docId": {
      "filePath": "_main/recite.$docId.tsx",
      "parent": "/_main"
    }
  }
}
ROUTE_MANIFEST_END */
