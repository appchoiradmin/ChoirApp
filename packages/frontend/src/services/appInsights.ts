import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Application Insights configuration
const appInsights = new ApplicationInsights({
  config: {
    // You'll need to replace this with your actual Application Insights connection string
    // We'll get this from Azure Portal in the next step
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING || '',
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
    enableAjaxErrorStatusText: true,
    enableAjaxPerfTracking: true,
    enableUnhandledPromiseRejectionTracking: true,
    disableFetchTracking: false,
    enableConsoleLogging: true, // This will capture console.log statements
  }
});

// Initialize Application Insights
if (import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING) {
  appInsights.loadAppInsights();
  appInsights.trackPageView(); // Track initial page view
  
  console.log('🔍 Application Insights initialized for production logging');
} else {
  console.log('⚠️ Application Insights not initialized - missing connection string');
}

// Custom logging functions that will send to Application Insights
export const logInfo = (message: string, properties?: Record<string, any>) => {
  console.log(message, properties);
  if (appInsights.appInsights) {
    appInsights.trackTrace({
      message,
      severityLevel: 1, // Information
      properties
    });
  }
};

export const logError = (message: string, error?: Error, properties?: Record<string, any>) => {
  console.error(message, error, properties);
  if (appInsights.appInsights) {
    appInsights.trackException({
      exception: error || new Error(message),
      properties
    });
  }
};

export const logEvent = (name: string, properties?: Record<string, any>) => {
  console.log(`📊 Event: ${name}`, properties);
  if (appInsights.appInsights) {
    appInsights.trackEvent({
      name,
      properties
    });
  }
};

export default appInsights;
