using ChoirApp.Application.Dtos;
using FluentResults;

namespace ChoirApp.Application.Contracts;

public interface IMasterSongService
{
    Task<Result<IEnumerable<MasterSongDto>>> GetAllMasterSongsAsync();
    Task<Result<MasterSongDto>> GetMasterSongByIdAsync(Guid id);
    Task<Result<MasterSongDto>> CreateMasterSongAsync(CreateMasterSongDto createMasterSongDto);
    Task<Result<MasterSongDto>> AddTagToSongAsync(Guid songId, string tagName);
    Task<Result<bool>> RemoveTagFromSongAsync(Guid songId, Guid tagId);
    Task<Result<IEnumerable<MasterSongDto>>> SearchSongsAsync(string? title, string? artist, string? tag);
    Task<Result<IEnumerable<TagDto>>> GetAllTagsAsync();
}
