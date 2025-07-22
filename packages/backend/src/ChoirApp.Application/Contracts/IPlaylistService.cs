using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FluentResults;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface IPlaylistService
    {
        Task<Result<Playlist>> CreatePlaylistAsync(CreatePlaylistDto playlistDto, Guid userId);
        Task<Result<Playlist>> GetPlaylistByIdAsync(Guid playlistId);
        Task<Result<IEnumerable<Playlist>>> GetPlaylistsByChoirIdAsync(Guid choirId);
        Task<Result> UpdatePlaylistAsync(Guid playlistId, UpdatePlaylistDto playlistDto, Guid userId);
        Task<Result> DeletePlaylistAsync(Guid playlistId, Guid userId);

        Task<Result<PlaylistTemplate>> CreatePlaylistTemplateAsync(CreatePlaylistTemplateDto templateDto, Guid userId);
        Task<Result<PlaylistTemplate>> GetPlaylistTemplateByIdAsync(Guid templateId);
        Task<Result<IEnumerable<PlaylistTemplate>>> GetPlaylistTemplatesByChoirIdAsync(Guid choirId, string language = "en", string? templateTitle = null, string? templateDescription = null, string? sectionTitle = null);
        Task<Result> UpdatePlaylistTemplateAsync(Guid templateId, UpdatePlaylistTemplateDto templateDto, Guid userId);
        Task<Result> DeletePlaylistTemplateAsync(Guid templateId, Guid userId);
        Task<Result> SetPlaylistTemplateDefaultAsync(Guid templateId, SetTemplateDefaultDto dto, Guid userId);
        Task<Result> AddSongToPlaylistAsync(string playlistId, AddSongToPlaylistDto dto);
        Task<Result> RemoveSongFromPlaylistAsync(string playlistId, string songId);
        Task<Result> MoveSongInPlaylistAsync(string playlistId, string songId, string fromSectionId, string toSectionId, Guid userId);
    }
}
