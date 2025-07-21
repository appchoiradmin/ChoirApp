using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FluentResults;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

// Use aliases to resolve ambiguity between domain and DTO enums
using DomainEntities = ChoirApp.Domain.Entities;
using AppDto = ChoirApp.Application.Dtos;

namespace ChoirApp.Application.Services
{
    public class PlaylistService : IPlaylistService
    {
        private readonly IPlaylistRepository _playlistRepository;
        private readonly IChoirRepository _choirRepository;
        private readonly IPlaylistTemplateRepository _playlistTemplateRepository;
        private readonly ISongRepository _songRepository;

        public PlaylistService(
            IPlaylistRepository playlistRepository,
            IChoirRepository choirRepository,
            IPlaylistTemplateRepository playlistTemplateRepository,
            ISongRepository songRepository)
        {
            _playlistRepository = playlistRepository;
            _choirRepository = choirRepository;
            _playlistTemplateRepository = playlistTemplateRepository;
            _songRepository = songRepository;
        }

        public async Task<Result<Playlist>> CreatePlaylistAsync(CreatePlaylistDto playlistDto, Guid userId)
        {
            var choir = await _choirRepository.GetByIdAsync(playlistDto.ChoirId);
            if (choir == null)
                return Result.Fail("Choir not found.");

            // Convert IsPublic boolean to SongVisibilityType enum
            var visibility = playlistDto.IsPublic ? DomainEntities.SongVisibilityType.PublicAll : DomainEntities.SongVisibilityType.Private;
            
            // Parse the date from the DTO - this is critical for date-based playlist isolation
            DateTimeOffset? playlistDate = null;
            if (playlistDto.Date != default(DateTime))
            {
                // CRITICAL FIX: Properly handle UTC dates from frontend
                // Frontend sends ISO string that gets parsed as DateTime without timezone info
                // We need to treat it as UTC to preserve the exact date selected by user
                playlistDate = new DateTimeOffset(playlistDto.Date, TimeSpan.Zero); // Treat as UTC
                Console.WriteLine($"🚨 DEBUG - Backend creating playlist with date: {playlistDate} (UTC)");
                Console.WriteLine($"🚨 DEBUG - Original DTO date: {playlistDto.Date} (Kind: {playlistDto.Date.Kind})");
            }
            else
            {
                Console.WriteLine("🚨 DEBUG - No date provided in DTO, using current time");
            }
            
            var playlistResult = Playlist.Create(
                name: playlistDto.Title ?? string.Empty, 
                description: null, 
                creatorId: userId, 
                choirId: playlistDto.ChoirId, 
                visibility: visibility,
                createdAt: playlistDate);
                
            if (playlistResult.IsFailed)
                return Result.Fail(playlistResult.Errors);

            var playlist = playlistResult.Value;

            if (playlistDto.PlaylistTemplateId.HasValue)
            {
                Console.WriteLine($"🚨 DEBUG - Creating playlist with template ID: {playlistDto.PlaylistTemplateId.Value}");
                var template = await _playlistTemplateRepository.GetByIdWithSectionsAsync(playlistDto.PlaylistTemplateId.Value);

                if (template != null)
                {
                    Console.WriteLine($"🚨 DEBUG - Template found: {template.Title} with {template.Sections.Count} sections");
                    foreach (var sectionTemplate in template.Sections.OrderBy(s => s.Order))
                    {
                        Console.WriteLine($"🚨 DEBUG - Adding section: {sectionTemplate.Title} (Order: {sectionTemplate.Order})");
                        var sectionResult = playlist.AddSection(sectionTemplate.Title);
                        if (sectionResult.IsFailed)
                            return Result.Fail(sectionResult.Errors);

                        // Note: PlaylistTemplateSongs entity has been removed
                        // Create an empty section without songs
                        var newSection = playlist.Sections.Last();
                        Console.WriteLine($"🚨 DEBUG - Section created with ID: {newSection.SectionId}");
                    }
                }
                else
                {
                    Console.WriteLine($"🚨 DEBUG - Template NOT FOUND for ID: {playlistDto.PlaylistTemplateId.Value}");
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

            await _playlistRepository.AddAsync(playlist);
            await _playlistRepository.SaveChangesAsync();
            return Result.Ok(playlist);
        }

        public async Task<Result<Playlist>> GetPlaylistByIdAsync(Guid playlistId)
        {
            var playlist = await _playlistRepository.GetByIdWithSectionsAsync(playlistId);
            if (playlist == null)
                return Result.Fail("Playlist not found.");

            return Result.Ok(playlist);
        }

        public async Task<Result<IEnumerable<Playlist>>> GetPlaylistsByChoirIdAsync(Guid choirId)
        {
            var playlists = await _playlistRepository.GetByChoirIdAsync(choirId);
            return Result.Ok(playlists.AsEnumerable());
        }

        public async Task<Result<Playlist>> GetPlaylistByChoirIdAndDateAsync(Guid choirId, DateTimeOffset date, Guid userId)
        {
            // Check if user is a member of this choir
            var userChoir = await _choirRepository.GetUserChoirAsync(userId, choirId);
            if (userChoir == null)
                return Result.Fail("User is not a member of this choir.");

            var playlist = await _playlistRepository.GetByChoirIdAndDateAsync(choirId, date);
            if (playlist != null)
                return Result.Ok(playlist);

            // If no playlist exists for this date, get the default template and create a virtual playlist
            var defaultTemplate = await _playlistTemplateRepository.GetDefaultByChoirIdAsync(choirId);
            if (defaultTemplate == null)
                return Result.Fail("No playlist found for the specified date and no default template available.");

            // Load template with sections
            var templateWithSections = await _playlistTemplateRepository.GetByIdWithSectionsAsync(defaultTemplate.TemplateId);
            if (templateWithSections == null)
                return Result.Fail("Default template not found.");

            // Create a virtual playlist based on the default template
            var virtualPlaylist = CreateVirtualPlaylistFromTemplate(templateWithSections, choirId, date);
            return Result.Ok(virtualPlaylist);
        }

        /// <summary>
        /// Creates a virtual playlist from a template for display when no actual playlist exists for a date
        /// </summary>
        private Playlist CreateVirtualPlaylistFromTemplate(PlaylistTemplate template, Guid choirId, DateTimeOffset date)
        {
            // Create a virtual playlist with a temporary ID and the template structure
            var virtualPlaylistResult = Playlist.Create(
                name: $"Template: {template.Title}",
                description: "Virtual playlist based on default template",
                creatorId: Guid.Empty, // Virtual playlist, no specific creator
                choirId: choirId,
                visibility: DomainEntities.SongVisibilityType.Private,
                createdAt: date
            );

            if (virtualPlaylistResult.IsFailed)
                throw new InvalidOperationException("Failed to create virtual playlist from template");

            var virtualPlaylist = virtualPlaylistResult.Value;

            // Add sections from the template to the virtual playlist
            if (template.Sections != null)
            {
                foreach (var templateSection in template.Sections.OrderBy(s => s.Order))
                {
                    var sectionResult = PlaylistSection.Create(
                        title: templateSection.Title,
                        playlistId: virtualPlaylist.PlaylistId,
                        order: templateSection.Order
                    );

                    if (sectionResult.IsSuccess)
                    {
                        virtualPlaylist.Sections.Add(sectionResult.Value);
                    }
                }
            }

            return virtualPlaylist;
        }

        public async Task<Result> UpdatePlaylistAsync(Guid playlistId, UpdatePlaylistDto playlistDto, Guid userId)
        {
            var playlist = await _playlistRepository.GetByIdWithSectionsAsync(playlistId);
            if (playlist == null)
                return Result.Fail("Playlist not found.");

            // Check if user is a member of this choir
            if (!playlist.ChoirId.HasValue)
                return Result.Fail("Playlist is not associated with a choir.");
            
            var userChoir = await _choirRepository.GetUserChoirAsync(userId, playlist.ChoirId.Value);
            if (userChoir == null)
                return Result.Fail("User is not a member of this choir.");

            playlist.UpdateTitle(playlistDto.Title ?? "");
            if (playlistDto.IsPublic.HasValue)
            {
                var visibility = playlistDto.IsPublic.Value ? DomainEntities.SongVisibilityType.PublicAll : DomainEntities.SongVisibilityType.Private;
                playlist.SetVisibility(visibility);
            }

            // Atomic update of sections and songs
            if (playlistDto.Sections != null)
            {
                // Remove all existing songs and sections atomically
                await _playlistRepository.RemoveAllSectionsAsync(playlist.PlaylistId);
                await _playlistRepository.SaveChangesAsync();

                // Recreate sections and songs from DTO
                int sectionOrder = 0;
                foreach (var sectionDto in playlistDto.Sections)
                {
                    var sectionResult = PlaylistSection.Create(sectionDto.Title, playlist.PlaylistId, sectionOrder);
                    if (sectionResult.IsFailed)
                        return Result.Fail(sectionResult.Errors);
                    
                    var section = sectionResult.Value;
                    await _playlistRepository.AddSectionAsync(section);

                    int songOrder = 0;
                    foreach (var songDto in sectionDto.Songs)
                    {
                        var songResult = PlaylistSong.Create(section.SectionId, songOrder, songDto.SongId);
                        if (songResult.IsFailed)
                            return Result.Fail(songResult.Errors);
                        
                        var song = songResult.Value;
                        await _playlistRepository.AddPlaylistSongAsync(song);
                        songOrder++;
                    }
                    sectionOrder++;
                }
            }

            await _playlistRepository.UpdateAsync(playlist);
            await _playlistRepository.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> DeletePlaylistAsync(Guid playlistId, Guid userId)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null)
                return Result.Fail("Playlist not found.");

            // Check if user is a member of this choir
            if (!playlist.ChoirId.HasValue)
                return Result.Fail("Playlist is not associated with a choir.");
            
            var userChoir = await _choirRepository.GetUserChoirAsync(userId, playlist.ChoirId.Value);
            if (userChoir == null)
                return Result.Fail("User is not a member of this choir.");

            await _playlistRepository.DeleteAsync(playlist);
            return Result.Ok();
        }

        // Playlist Template Methods
        public async Task<Result<PlaylistTemplate>> CreatePlaylistTemplateAsync(CreatePlaylistTemplateDto templateDto, Guid userId)
        {
            var choir = await _choirRepository.GetByIdAsync(templateDto.ChoirId);
            if (choir == null)
                return Result.Fail("Choir not found.");

            var existingTemplates = await _playlistTemplateRepository.GetByChoirIdAsync(templateDto.ChoirId);
            if (existingTemplates.Any(t => t.Title == templateDto.Title))
                return Result.Fail("A template with this title already exists in the choir.");

            // Check if this will be the first template for the choir
            bool isFirstTemplate = !existingTemplates.Any();

            var templateResult = PlaylistTemplate.Create(templateDto.Title, templateDto.ChoirId, templateDto.Description, isFirstTemplate);
            if (templateResult.IsFailed)
                return Result.Fail(templateResult.Errors);

            var template = templateResult.Value;
            await _playlistTemplateRepository.AddAsync(template);

            for (int i = 0; i < templateDto.Sections.Count; i++)
            {
                var sectionTitle = templateDto.Sections[i];
                var sectionResult = PlaylistTemplateSection.Create(sectionTitle, template.TemplateId, i);
                if (sectionResult.IsFailed)
                {
                    return Result.Fail(sectionResult.Errors);
                }
                await _playlistTemplateRepository.AddTemplateSectionAsync(sectionResult.Value);
            }

            await _playlistTemplateRepository.SaveChangesAsync();
            return Result.Ok(template);
        }

        public async Task<Result<PlaylistTemplate>> GetPlaylistTemplateByIdAsync(Guid templateId)
        {
            var template = await _playlistTemplateRepository.GetByIdWithSectionsAsync(templateId);
            if (template == null)
                return Result.Fail("Playlist template not found.");

            return Result.Ok(template);
        }

        public async Task<Result<IEnumerable<PlaylistTemplate>>> GetPlaylistTemplatesByChoirIdAsync(Guid choirId)
        {
            // Get all existing templates for this choir
            var templates = await _playlistTemplateRepository.GetByChoirIdAsync(choirId);
            var templateList = templates.ToList();

            // Check if a generic template exists for this choir
            var genericTemplate = templateList.FirstOrDefault(t => 
                t.Title.Equals("Generic Template", StringComparison.OrdinalIgnoreCase));

            // If no generic template exists, create one
            if (genericTemplate == null)
            {
                var createResult = await CreateGenericTemplateForChoir(choirId);
                if (createResult.IsSuccess)
                {
                    templateList.Add(createResult.Value);
                }
                // If creation fails, we continue without the generic template
                // The user can still use existing templates
            }

            return Result.Ok<IEnumerable<PlaylistTemplate>>(templateList);
        }

        public async Task<Result> UpdatePlaylistTemplateAsync(Guid templateId, UpdatePlaylistTemplateDto templateDto, Guid userId)
        {
            var template = await _playlistTemplateRepository.GetByIdWithSectionsAsync(templateId);
            if (template == null)
                return Result.Fail("Playlist template not found.");

            // Check if user is a member of this choir
            var userChoir = await _choirRepository.GetUserChoirAsync(userId, template.ChoirId);
            if (userChoir == null)
                return Result.Fail("User is not a member of this choir.");

            if (templateDto.Title != null)
                template.UpdateTitle(templateDto.Title);

            if (templateDto.Description != null)
                template.UpdateDescription(templateDto.Description);

            if (templateDto.Sections != null)
            {
                await _playlistTemplateRepository.RemoveAllTemplateSectionsAsync(template.TemplateId);
                for (int i = 0; i < templateDto.Sections.Count; i++)
                {
                    var sectionTitle = templateDto.Sections[i];
                    var sectionResult = PlaylistTemplateSection.Create(sectionTitle, template.TemplateId, i);
                    if (sectionResult.IsFailed)
                    {
                        return Result.Fail(sectionResult.Errors);
                    }
                    await _playlistTemplateRepository.AddTemplateSectionAsync(sectionResult.Value);
                }
            }

            await _playlistTemplateRepository.UpdateAsync(template);
            await _playlistTemplateRepository.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> DeletePlaylistTemplateAsync(Guid templateId, Guid userId)
        {
            var template = await _playlistTemplateRepository.GetByIdAsync(templateId);
            if (template == null)
                return Result.Fail("Playlist template not found.");

            // Check if user is a member of this choir
            var userChoir = await _choirRepository.GetUserChoirAsync(userId, template.ChoirId);
            if (userChoir == null)
                return Result.Fail("User is not a member of this choir.");

            await _playlistTemplateRepository.DeleteAsync(template);
            return Result.Ok();
        }

        public async Task<Result> SetPlaylistTemplateDefaultAsync(Guid templateId, SetTemplateDefaultDto dto, Guid userId)
        {
            var template = await _playlistTemplateRepository.GetByIdAsync(templateId);
            if (template == null)
                return Result.Fail("Playlist template not found.");

            var userChoir = await _choirRepository.GetUserChoirAsync(userId, template.ChoirId);
            if (userChoir == null)
                return Result.Fail("User is not a member of this choir.");

            if (dto.IsDefault)
            {
                // Clear default status from all other templates in this choir
                var otherDefaultTemplates = await _playlistTemplateRepository.GetByChoirIdAsync(template.ChoirId);
                
                foreach (var otherTemplate in otherDefaultTemplates.Where(t => t.IsDefault && t.TemplateId != templateId))
                {
                    otherTemplate.SetDefault(false);
                    await _playlistTemplateRepository.UpdateAsync(otherTemplate);
                }
            }

            // Set the default status for this template
            template.SetDefault(dto.IsDefault);
            await _playlistTemplateRepository.UpdateAsync(template);
            return Result.Ok();
        }

        // Song Management Methods - Migrated from Infrastructure
        public async Task<Result> AddSongToPlaylistAsync(string playlistId, AddSongToPlaylistDto dto)
        {
            if (!Guid.TryParse(playlistId, out var playlistGuid))
                return Result.Fail("Invalid playlist id");

            var playlist = await _playlistRepository.GetByIdWithFullDetailsAsync(playlistGuid);
            if (playlist == null)
                return Result.Fail("Playlist not found.");

            // Debug: Log all section IDs in the playlist
            Console.WriteLine($"🚨 DEBUG - Playlist {playlistGuid} has {playlist.Sections.Count} sections:");
            foreach (var s in playlist.Sections)
            {
                Console.WriteLine($"  - Section ID: {s.SectionId}, Title: {s.Title}");
            }

            if (!Guid.TryParse(dto.SectionId, out var sectionGuid))
                return Result.Fail("Invalid section id");

            Console.WriteLine($"🚨 DEBUG - Looking for section ID: {sectionGuid}");

            var section = playlist.Sections.FirstOrDefault(s => s.SectionId == sectionGuid);
            if (section == null)
            {
                Console.WriteLine($"🚨 DEBUG - Section {sectionGuid} NOT FOUND in playlist {playlistGuid}");
                return Result.Fail("Section not found in the playlist.");
            }

            Console.WriteLine($"🚨 DEBUG - Section {sectionGuid} FOUND: {section.Title}");

            if (!Guid.TryParse(dto.SongId, out var songGuid))
                return Result.Fail("Invalid song id");

            var song = await _songRepository.GetByIdAsync(songGuid);
            if (song == null)
                return Result.Fail("Song not found");

            var songResult = section.AddSong(songGuid);
            if (songResult.IsFailed)
                return Result.Fail(songResult.Errors);

            await _playlistRepository.AddPlaylistSongAsync(songResult.Value);
            await _playlistRepository.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> RemoveSongFromPlaylistAsync(string playlistId, string songId)
        {
            if (!Guid.TryParse(playlistId, out var playlistGuid) || !Guid.TryParse(songId, out var songGuid))
            {
                return Result.Fail("Invalid GUID format.");
            }

            var playlist = await _playlistRepository.GetByIdWithFullDetailsAsync(playlistGuid);
            if (playlist == null)
                return Result.Fail("Playlist not found.");

            var songToRemove = playlist.Sections
                .SelectMany(s => s.PlaylistSongs)
                .FirstOrDefault(s => s.PlaylistSongId == songGuid);

            if (songToRemove == null)
                return Result.Fail("Song not found in playlist.");

            await _playlistRepository.RemovePlaylistSongAsync(songToRemove);
            await _playlistRepository.SaveChangesAsync();

            return Result.Ok();
        }

        public async Task<Result> MoveSongInPlaylistAsync(string playlistId, string songId, string fromSectionId, string toSectionId, Guid userId)
        {
            if (!Guid.TryParse(playlistId, out var playlistGuid) || 
                !Guid.TryParse(songId, out var songGuid) ||
                !Guid.TryParse(fromSectionId, out var fromSectionGuid) ||
                !Guid.TryParse(toSectionId, out var toSectionGuid))
            {
                return Result.Fail("Invalid GUID format.");
            }

            var playlist = await _playlistRepository.GetByIdWithFullDetailsAsync(playlistGuid);
            if (playlist == null)
                return Result.Fail("Playlist not found.");

            // Verify user permissions
            if (playlist.ChoirId.HasValue)
            {
                var userChoir = await _choirRepository.GetUserChoirAsync(userId, playlist.ChoirId.Value);
                if (userChoir == null)
                    return Result.Fail("User is not a member of this choir.");
            }

            var fromSection = playlist.Sections.FirstOrDefault(s => s.SectionId == fromSectionGuid);
            var toSection = playlist.Sections.FirstOrDefault(s => s.SectionId == toSectionGuid);

            if (fromSection == null || toSection == null)
                return Result.Fail("Section not found.");

            var songToMove = fromSection.PlaylistSongs.FirstOrDefault(s => s.PlaylistSongId == songGuid);
            if (songToMove == null)
                return Result.Fail("Song not found in source section.");

            // Update the song's section and order in place instead of creating a new one
            var newOrder = toSection.PlaylistSongs.Count;
            songToMove.UpdateSection(toSection.SectionId, newOrder);

            await _playlistRepository.UpdatePlaylistSongAsync(songToMove);
            await _playlistRepository.SaveChangesAsync();
            return Result.Ok();
        }

        private async Task<Result<PlaylistTemplate>> CreateGenericTemplateForChoir(Guid choirId)
        {
            // Create the generic template
            var templateResult = PlaylistTemplate.Create(
                title: "Generic Template",
                description: "Default template with one section for songs",
                choirId: choirId,
                isDefault: false // Not default, just a fallback
            );

            if (templateResult.IsFailed)
                return Result.Fail<PlaylistTemplate>(templateResult.Errors);

            var template = templateResult.Value;

            // Add the template to the repository
            await _playlistTemplateRepository.AddAsync(template);
            await _playlistTemplateRepository.SaveChangesAsync();

            // Create one section for the template
            var sectionResult = PlaylistTemplateSection.Create(
                templateId: template.TemplateId,
                title: "Songs",
                order: 1
            );

            if (sectionResult.IsFailed)
                return Result.Ok(template); // Return template even if section creation fails

            var section = sectionResult.Value;
            await _playlistTemplateRepository.AddTemplateSectionAsync(section);
            await _playlistTemplateRepository.SaveChangesAsync();

            // Reload the template with its sections
            var reloadedTemplate = await _playlistTemplateRepository.GetByIdAsync(template.TemplateId);
            return Result.Ok(reloadedTemplate ?? template);
        }
    }
}
