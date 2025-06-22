using ChoirApp.Application.Dtos;
using FluentResults;

namespace ChoirApp.Application.Contracts;

public interface IChoirSongService
{
    Task<Result<IEnumerable<ChoirSongVersionDto>>> GetChoirSongVersionsAsync(Guid choirId);
    Task<Result<ChoirSongVersionDto>> GetChoirSongVersionByIdAsync(Guid choirId, Guid songId);
    Task<Result<ChoirSongVersionDto>> CreateChoirSongVersionAsync(Guid choirId, Guid userId, CreateChoirSongVersionDto createChoirSongVersionDto);
}
