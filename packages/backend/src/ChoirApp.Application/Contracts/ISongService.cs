using ChoirApp.Application.Dtos;
using FluentResults;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface ISongService
    {
        Task<Result<SongDto>> CreateSongAsync(string title, string? artist, string content, Guid creatorId, Domain.Entities.SongVisibilityType visibility, string? audioUrl = null, List<Guid>? visibleToChoirs = null, List<string>? tags = null);
        Task<Result<SongDto>> CreateSongVersionAsync(Guid baseSongId, string content, Guid creatorId, Domain.Entities.SongVisibilityType visibility, string? audioUrl = null, List<Guid>? visibleToChoirs = null, List<string>? tags = null);
        Task<Result<SongDto>> GetSongByIdAsync(Guid songId);
        Task<Result<List<SongDto>>> GetSongsByUserIdAsync(Guid userId);
        Task<Result<List<SongDto>>> GetSongsByChoirIdAsync(Guid choirId);
        Task<Result<List<SongDto>>> GetAllPublicSongsAsync();
        Task<Result<List<SongDto>>> SearchSongsAsync(string searchTerm, Guid? userId, Guid? choirId);
        Task<Result<SongDto>> UpdateSongAsync(Guid songId, string title, string? artist, string content, Guid userId, string? audioUrl = null, List<string>? tags = null);
        Task<Result> UpdateSongVisibilityAsync(Guid songId, Domain.Entities.SongVisibilityType visibility, Guid userId, List<Guid>? visibleToChoirs = null);
        Task<Result> AddSongVisibilityToChoirAsync(Guid songId, Guid choirId, Guid userId);
        Task<Result> RemoveSongVisibilityFromChoirAsync(Guid songId, Guid choirId, Guid userId);
        Task<Result> AddTagToSongAsync(Guid songId, string tagName);
        Task<Result> RemoveTagFromSongAsync(Guid songId, Guid tagId);
        Task<Result> DeleteSongAsync(Guid songId, Guid userId);
        Task<Result<IEnumerable<TagDto>>> GetAllTagsAsync();
    }
}
