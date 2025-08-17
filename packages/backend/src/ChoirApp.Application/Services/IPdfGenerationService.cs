using FluentResults;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Application.Services;

public interface IPdfGenerationService
{
    Task<Result<byte[]>> GeneratePlaylistPdfAsync(Guid playlistId);
}
