using ChoirApp.Application.Services;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.Playlist;

public class GetPlaylistPdfEndpoint : Endpoint<GetPlaylistPdfRequest, byte[]>
{
    private readonly IPdfGenerationService _pdfGenerationService;

    public GetPlaylistPdfEndpoint(IPdfGenerationService pdfGenerationService)
    {
        _pdfGenerationService = pdfGenerationService;
    }

    public override void Configure()
    {
        Get("/playlists/{PlaylistId}/pdf");
        AllowAnonymous(); // Public endpoint for sharing
    }

    public override async Task HandleAsync(GetPlaylistPdfRequest req, CancellationToken ct)
    {
        var result = await _pdfGenerationService.GeneratePlaylistPdfAsync(req.PlaylistId);
        
        if (result.IsFailed)
        {
            await SendErrorsAsync(404, ct);
            return;
        }

        // Set response headers for PDF download
        HttpContext.Response.ContentType = "application/pdf";
        HttpContext.Response.Headers["Content-Disposition"] = $"attachment; filename=\"playlist-{req.PlaylistId}.pdf\"";
        
        await SendBytesAsync(result.Value, cancellation: ct);
    }
}

public class GetPlaylistPdfRequest
{
    public Guid PlaylistId { get; set; }
}
