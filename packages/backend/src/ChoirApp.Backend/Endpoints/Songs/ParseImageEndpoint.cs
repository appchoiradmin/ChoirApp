using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ChoirApp.Application.Contracts;
using ChoirApp.Backend.Endpoints.Songs.Requests;
using ChoirApp.Backend.Endpoints.Songs.Responses;
using ChoirApp.Domain.Entities;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class ParseImageEndpoint : Endpoint<ParseImageRequest, ParseImageResponse>
    {
        private readonly ISheetMusicTranscriptionService _transcriptionService;
        private readonly ILogger<ParseImageEndpoint> _logger;

        public ParseImageEndpoint(ISheetMusicTranscriptionService transcriptionService, ILogger<ParseImageEndpoint> logger)
        {
            _transcriptionService = transcriptionService;
            _logger = logger;
        }

        public override void Configure()
        {
            Verbs("POST", "OPTIONS");
            Routes("/songs/parse-image");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
            AllowFileUploads();
        }

        public override async Task HandleAsync(ParseImageRequest req, CancellationToken ct)
        {
            try
            {
                // Get the uploaded file
                var file = req.File;
                if (file == null)
                {
                    ValidationFailures.Add(new()
                    {
                        PropertyName = nameof(req.File),
                        ErrorMessage = "File is required"
                    });
                    await SendErrorsAsync(400, ct);
                    return;
                }

                // Validate file type - only images for optimal OCR results
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
                if (!allowedTypes.Contains(file.ContentType?.ToLower()))
                {
                    ValidationFailures.Add(new()
                    {
                        PropertyName = nameof(req.File),
                        ErrorMessage = "Only image files (JPEG, PNG, GIF) are supported. For best OCR results, upload clear photos of sheet music."
                    });
                    await SendErrorsAsync(400, ct);
                    return;
                }

                // Validate file size (max 10MB)
                const long maxFileSize = 10 * 1024 * 1024; // 10MB
                if (file.Length > maxFileSize)
                {
                    ValidationFailures.Add(new()
                    {
                        PropertyName = nameof(req.File),
                        ErrorMessage = "File size must be less than 10MB"
                    });
                    await SendErrorsAsync(400, ct);
                    return;
                }

                _logger.LogInformation("Processing image upload: {FileName}, Size: {FileSize} bytes", 
                    file.FileName, file.Length);

                // Process the image
                using var stream = file.OpenReadStream();
                var result = await _transcriptionService.ConvertImageToChordProAsync(stream, file.FileName);

                if (result.IsFailed)
                {
                    _logger.LogError("Sheet music transcription failed: {Errors}", string.Join(", ", result.Errors));
                    ValidationFailures.Add(new()
                    {
                        PropertyName = "processing",
                        ErrorMessage = string.Join(", ", result.Errors)
                    });
                    await SendErrorsAsync(500, ct);
                    return;
                }

                await SendOkAsync(new ParseImageResponse
                {
                    ChordProContent = result.Value,
                    FileName = file.FileName,
                    ProcessedAt = DateTime.UtcNow
                }, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error processing image upload");
                await SendErrorsAsync(500, ct);
            }
        }
    }
}
