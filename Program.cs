using Yarp.ReverseProxy.Configuration;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = Path.Combine("dist", "client")
});

// Este proyecto sirve React. La autenticación y los datos de usuarios pertenecen a NexaBack.
var backendAddress = builder.Configuration["NEXA_API_URL"]
    ?? (builder.Environment.IsDevelopment() ? "https://localhost:44388/"
        : throw new InvalidOperationException("Configurá NEXA_API_URL con la dirección de NexaBack."));
if (!Uri.TryCreate(backendAddress, UriKind.Absolute, out var backendUri)
    || (backendUri.Scheme != Uri.UriSchemeHttp && backendUri.Scheme != Uri.UriSchemeHttps))
    throw new InvalidOperationException("NEXA_API_URL debe ser una URL HTTP o HTTPS válida.");
if (!builder.Environment.IsDevelopment() && backendUri.Scheme != Uri.UriSchemeHttps && !backendUri.IsLoopback)
    throw new InvalidOperationException("La conexión remota a NexaBack debe usar HTTPS.");

builder.Services.AddReverseProxy().LoadFromMemory(
    [new RouteConfig { RouteId = "nexa-api", ClusterId = "nexa-backend", Match = new RouteMatch { Path = "/api/{**path}" } }],
    [new ClusterConfig
    {
        ClusterId = "nexa-backend",
        Destinations = new Dictionary<string, DestinationConfig>
        {
            ["backend"] = new() { Address = backendUri.AbsoluteUri.TrimEnd('/') + "/" }
        }
    }]);

var app = builder.Build();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapReverseProxy();
app.MapFallbackToFile("index.html");
app.Run();
