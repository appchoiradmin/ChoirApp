using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using FluentResults;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChoirApp.Infrastructure.Services
{
    public class PlaylistService : IPlaylistService
    {
        private readonly ApplicationDbContext _context;

        public PlaylistService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result<Playlist>> CreatePlaylistAsync(CreatePlaylistDto playlistDto, Guid userId)
        {
            var choir = await _context.Choirs.FindAsync(playlistDto.ChoirId);
            if (choir == null)
                return Result.Fail("Choir not found.");

            var playlistResult = Playlist.Create(playlistDto.Title, playlistDto.ChoirId, playlistDto.IsPublic, playlistDto.Date, playlistDto.PlaylistTemplateId);
            if (playlistResult.IsFailed)
                return Result.Fail(playlistResult.Errors);

            var playlist = playlistResult.Value;

            if (playlistDto.PlaylistTemplateId.HasValue)
            {
                var template = await _context.PlaylistTemplates
                    .Include(t => t.Sections)
                    .ThenInclude(s => s.PlaylistTemplateSongs)
                    .FirstOrDefaultAsync(t => t.TemplateId == playlistDto.PlaylistTemplateId.Value);

                if (template != null)
                {
                    foreach (var sectionTemplate in template.Sections.OrderBy(s => s.Order))
                    {
                        var sectionResult = playlist.AddSection(sectionTemplate.Title);
                        if (sectionResult.IsFailed)
                            return Result.Fail(sectionResult.Errors);

                        var newSection = playlist.Sections.Last();
                        foreach (var songTemplate in sectionTemplate.PlaylistTemplateSongs.OrderBy(s => s.Order))
                        {
                            var songResult = newSection.AddSong(songTemplate.MasterSongId, songTemplate.ChoirSongVersionId);
                            if (songResult.IsFailed)
                                return Result.Fail(songResult.Errors);
                        }
                    }
                }
            }
            else
            {
                foreach (var sectionDto in playlistDto.Sections)
                {
                    var sectionResult = playlist.AddSection(sectionDto.Title);
                    if (sectionResult.IsFailed)
                        return Result.Fail(sectionResult.Errors);
                }
            }

            _context.Playlists.Add(playlist);
            await _context.SaveChangesAsync();

            return Result.Ok(playlist);
        }

        public async Task<Result<Playlist>> GetPlaylistByIdAsync(Guid playlistId)
        {
            var playlist = await _context.Playlists
                .Include(p => p.Sections)
                .ThenInclude(s => s.PlaylistSongs)
                .ThenInclude(ps => ps.MasterSong)
                .Include(p => p.Sections)
                .ThenInclude(s => s.PlaylistSongs)
                .ThenInclude(ps => ps.ChoirSongVersion)
                .Include(p => p.PlaylistTags)
                .ThenInclude(pt => pt.Tag)
                .FirstOrDefaultAsync(p => p.PlaylistId == playlistId);

            if (playlist == null)
                return Result.Fail("Playlist not found.");

            return Result.Ok(playlist);
        }

        public async Task<Result<IEnumerable<Playlist>>> GetPlaylistsByChoirIdAsync(Guid choirId)
        {
            var playlists = await _context.Playlists
                .Include(p => p.Sections)
                .Where(p => p.ChoirId == choirId)
                .ToListAsync();

            return Result.Ok(playlists.AsEnumerable());
        }

        public async Task<Result> UpdatePlaylistAsync(Guid playlistId, UpdatePlaylistDto playlistDto, Guid userId)
        {
            var playlist = await _context.Playlists.FindAsync(playlistId);
            if (playlist == null)
                return Result.Fail("Playlist not found.");

            var userChoir = await _context.UserChoirs.FirstOrDefaultAsync(uc => uc.UserId == userId && uc.ChoirId == playlist.ChoirId);
            if (userChoir == null)
                return Result.Fail("User is not a member of this choir.");

            playlist.UpdateTitle(playlistDto.Title);
            if (playlistDto.IsPublic.HasValue)
                playlist.SetVisibility(playlistDto.IsPublic.Value);

            await _context.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> DeletePlaylistAsync(Guid playlistId, Guid userId)
        {
            var playlist = await _context.Playlists.FindAsync(playlistId);
            if (playlist == null)
                return Result.Fail("Playlist not found.");

            var userChoir = await _context.UserChoirs.FirstOrDefaultAsync(uc => uc.UserId == userId && uc.ChoirId == playlist.ChoirId);
            if (userChoir == null)
                return Result.Fail("User is not a member of this choir.");

            _context.Playlists.Remove(playlist);
            await _context.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result<PlaylistTemplate>> CreatePlaylistTemplateAsync(CreatePlaylistTemplateDto templateDto, Guid userId)
        {
            var choir = await _context.Choirs.FindAsync(templateDto.ChoirId);
            if (choir == null)
                return Result.Fail("Choir not found.");

            var existingTemplate = await _context.PlaylistTemplates
                .FirstOrDefaultAsync(t => t.ChoirId == templateDto.ChoirId && t.Title == templateDto.Title);

            if (existingTemplate != null)
                return Result.Fail("A template with this title already exists in the choir.");

            var templateResult = PlaylistTemplate.Create(templateDto.Title, templateDto.ChoirId, templateDto.Description);
            if (templateResult.IsFailed)
                return Result.Fail(templateResult.Errors);

            var template = templateResult.Value;
            _context.PlaylistTemplates.Add(template);

            for (int i = 0; i < templateDto.Sections.Count; i++)
            {
                var sectionTitle = templateDto.Sections[i];
                var sectionResult = PlaylistTemplateSection.Create(sectionTitle, template.TemplateId, i);
                if (sectionResult.IsFailed)
                {
                    return Result.Fail(sectionResult.Errors);
                }
                _context.PlaylistTemplateSections.Add(sectionResult.Value);
            }

            await _context.SaveChangesAsync();

            return Result.Ok(template);
        }

        public async Task<Result<PlaylistTemplate>> GetPlaylistTemplateByIdAsync(Guid templateId)
        {
            var template = await _context.PlaylistTemplates
                .Include(t => t.Sections)
                .ThenInclude(s => s.PlaylistTemplateSongs)
                .ThenInclude(ps => ps.MasterSong)
                .Include(t => t.Sections)
                .ThenInclude(s => s.PlaylistTemplateSongs)
                .ThenInclude(ps => ps.ChoirSongVersion)
                .FirstOrDefaultAsync(t => t.TemplateId == templateId);

            if (template == null)
                return Result.Fail("Playlist template not found.");

            return Result.Ok(template);
        }

        public async Task<Result<IEnumerable<PlaylistTemplate>>> GetPlaylistTemplatesByChoirIdAsync(Guid choirId)
        {
            var templates = await _context.PlaylistTemplates
                .Where(t => t.ChoirId == choirId)
                .ToListAsync();

            return Result.Ok(templates.AsEnumerable());
        }

        public async Task<Result> UpdatePlaylistTemplateAsync(Guid templateId, UpdatePlaylistTemplateDto templateDto, Guid userId)
        {
            var template = await _context.PlaylistTemplates.Include(t => t.Sections).FirstOrDefaultAsync(t => t.TemplateId == templateId);
            if (template == null)
                return Result.Fail("Playlist template not found.");

            var userChoir = await _context.UserChoirs.FirstOrDefaultAsync(uc => uc.UserId == userId && uc.ChoirId == template.ChoirId);
            if (userChoir == null)
                return Result.Fail("User is not a member of this choir.");

            if (templateDto.Title != null)
                template.UpdateTitle(templateDto.Title);

            if (templateDto.Description != null)
                template.UpdateDescription(templateDto.Description);

            if (templateDto.Sections != null)
            {
                _context.PlaylistTemplateSections.RemoveRange(template.Sections);
                for (int i = 0; i < templateDto.Sections.Count; i++)
                {
                    var sectionTitle = templateDto.Sections[i];
                    var sectionResult = PlaylistTemplateSection.Create(sectionTitle, template.TemplateId, i);
                    if (sectionResult.IsFailed)
                    {
                        return Result.Fail(sectionResult.Errors);
                    }
                    _context.PlaylistTemplateSections.Add(sectionResult.Value);
                }
            }

            await _context.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> DeletePlaylistTemplateAsync(Guid templateId, Guid userId)
        {
            var template = await _context.PlaylistTemplates.FindAsync(templateId);
            if (template == null)
                return Result.Fail("Playlist template not found.");

            var userChoir = await _context.UserChoirs.FirstOrDefaultAsync(uc => uc.UserId == userId && uc.ChoirId == template.ChoirId);
            if (userChoir == null)
                return Result.Fail("User is not a member of this choir.");

            _context.PlaylistTemplates.Remove(template);
            await _context.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> AddSongToPlaylistAsync(string playlistId, AddSongToPlaylistDto dto)
        {
            if (!Guid.TryParse(playlistId, out var playlistGuid))
                return Result.Fail("Invalid playlist id");

            var playlist = await _context.Playlists.Include(p => p.Sections).FirstOrDefaultAsync(p => p.PlaylistId == playlistGuid);
            if (playlist == null)
                return Result.Fail("Playlist not found.");

            if (!Guid.TryParse(dto.SectionId, out var sectionGuid))
                return Result.Fail("Invalid section id");

            var section = playlist.Sections.FirstOrDefault(s => s.SectionId == sectionGuid);
            if (section == null)
                return Result.Fail("Section not found in the playlist.");

            if (!Guid.TryParse(dto.SongId, out var songGuid))
                return Result.Fail("Invalid song id");

            var song = await _context.MasterSongs.FindAsync(songGuid);
            if (song == null)
                return Result.Fail("Song not found");

            Guid? choirSongVersionGuid = null;
            if (Guid.TryParse(dto.ChoirSongVersionId, out var parsedGuid))
            {
                choirSongVersionGuid = parsedGuid;
            }

            var songResult = section.AddSong(songGuid, choirSongVersionGuid);
            if (songResult.IsFailed)
                return Result.Fail(songResult.Errors);

            _context.PlaylistSongs.Add(songResult.Value);
            await _context.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> RemoveSongFromPlaylistAsync(string playlistId, string songId)
        {
            if (!Guid.TryParse(playlistId, out var playlistGuid) || !Guid.TryParse(songId, out var songGuid))
            {
                return Result.Fail("Invalid GUID format.");
            }

            var playlist = await _context.Playlists
                .Include(p => p.Sections)
                .ThenInclude(s => s.PlaylistSongs)
                .FirstOrDefaultAsync(p => p.PlaylistId == playlistGuid);

            if (playlist == null)
                return Result.Fail("Playlist not found.");

            var songToRemove = playlist.Sections
                .SelectMany(s => s.PlaylistSongs)
                .FirstOrDefault(s => s.MasterSongId == songGuid);

            if (songToRemove == null)
                return Result.Fail("Song not found in playlist.");

            _context.PlaylistSongs.Remove(songToRemove);
            await _context.SaveChangesAsync();

            return Result.Ok();
        }
    }
}
