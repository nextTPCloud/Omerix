declare module 'swagger-ui-react' {
  import { ComponentType } from 'react'

  interface SwaggerUIProps {
    spec?: object
    url?: string
    docExpansion?: 'list' | 'full' | 'none'
    defaultModelsExpandDepth?: number
    displayRequestDuration?: boolean
    filter?: boolean | string
    showExtensions?: boolean
    showCommonExtensions?: boolean
    tryItOutEnabled?: boolean
    [key: string]: any
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>
  export default SwaggerUI
}
