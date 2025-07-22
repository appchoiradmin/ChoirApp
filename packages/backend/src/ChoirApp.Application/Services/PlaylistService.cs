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
        private readonly IGlobalPlaylistTemplateService _globalTemplateService;

        public PlaylistService(
            IPlaylistRepository playlistRepository,
            IChoirRepository choirRepository,
            IPlaylistTemplateRepository playlistTemplateRepository,
            ISongRepository songRepository,
            IGlobalPlaylistTemplateService globalTemplateService)
        {
            _playlistRepository = playlistRepository;
            _choirRepository = choirRepository;
            _playlistTemplateRepository = playlistTemplateRepository;
            _songRepository = songRepository;
            _globalTemplateService = globalTemplateService;
        }

        public async Task<Result<Playlist>> CreatePlaylistAsync(CreatePlaylistDto playlistDto, Guid userId)
        {
            Console.WriteLine($"🚨 DEBUG - CreatePlaylistAsync called with template ID: {playlistDto.PlaylistTemplateId}");
            Console.WriteLine($"🚨 DEBUG - CreatePlaylistAsync DTO: Title={playlistDto.Title}, ChoirId={playlistDto.ChoirId}, Date={playlistDto.Date}");
            
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
                
                // First try to find it as a user template
                var userTemplate = await _playlistTemplateRepository.GetByIdWithSectionsAsync(playlistDto.PlaylistTemplateId.Value);
                
                if (userTemplate != null)
                {
                    Console.WriteLine($"🚨 DEBUG - User template found: {userTemplate.Title} with {userTemplate.Sections.Count} sections");
                    foreach (var sectionTemplate in userTemplate.Sections.OrderBy(s => s.Order))
                    {
                        Console.WriteLine($"🚨 DEBUG - Adding section: {sectionTemplate.Title} (Order: {sectionTemplate.Order})");
                        var sectionResult = playlist.AddSection(sectionTemplate.Title);
                        if (sectionResult.IsFailed)
                            return Result.Fail(sectionResult.Errors);

                        var newSection = playlist.Sections.Last();
                        Console.WriteLine($"🚨 DEBUG - Section created with ID: {newSection.SectionId}");
                    }
                }
                else
                {
                    // If not found as user template, try to find it as a global template
                    var globalTemplateResult = await _globalTemplateService.GetTemplateByIdAsync(playlistDto.PlaylistTemplateId.Value);
                    if (globalTemplateResult.IsSuccess && globalTemplateResult.Value != null)
                    {
                        var globalTemplate = globalTemplateResult.Value;
                        Console.WriteLine($"🚨 DEBUG - Global template found: {globalTemplate.TitleKey} with {globalTemplate.Sections.Count} sections");
                        
                        foreach (var sectionTemplate in globalTemplate.Sections.OrderBy(s => s.Order))
                        {
                            Console.WriteLine($"🚨 DEBUG - Adding global section: {sectionTemplate.TitleKey} (Order: {sectionTemplate.Order})");
                            var sectionResult = playlist.AddSection(sectionTemplate.TitleKey);
                            if (sectionResult.IsFailed)
                                return Result.Fail(sectionResult.Errors);

                            var newSection = playlist.Sections.Last();
                            Console.WriteLine($"🚨 DEBUG - Global section created with ID: {newSection.SectionId}");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"🚨 DEBUG - Template NOT FOUND (neither user nor global) for ID: {playlistDto.PlaylistTemplateId.Value}");
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
            // First, try to find in regular user-created templates
            var template = await _playlistTemplateRepository.GetByIdWithSectionsAsync(templateId);
            if (template != null)
                return Result.Ok(template);

            // If not found, check if it's a global template
            Console.WriteLine($"🚨 DEBUG - Looking for global template with ID: {templateId}");
            var globalTemplateResult = await _globalTemplateService.GetTemplateByIdAsync(templateId);
            Console.WriteLine($"🚨 DEBUG - Global template service result: IsSuccess={globalTemplateResult.IsSuccess}");
            
            if (globalTemplateResult.IsSuccess)
            {
                var globalTemplate = globalTemplateResult.Value;
                Console.WriteLine($"🚨 DEBUG - Global template value: {(globalTemplate != null ? $"Found - Title={globalTemplate.TitleKey}" : "NULL")}");
                
                if (globalTemplate == null)
                {
                    Console.WriteLine($"🚨 DEBUG - Global template is null, template not found");
                    return Result.Fail("Playlist template not found.");
                }
                
                Console.WriteLine($"🚨 DEBUG - About to return global template directly");
                
                // Create a virtual PlaylistTemplate-like object for global templates
                // We can't use PlaylistTemplate.Create() because it requires a valid choir ID
                // Instead, we'll create the object using reflection to bypass validation
                var virtualTemplate = (PlaylistTemplate)Activator.CreateInstance(typeof(PlaylistTemplate), true)!;
                
                // Set the properties using reflection
                var templateIdField = typeof(PlaylistTemplate).GetField("<TemplateId>k__BackingField", 
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                var titleField = typeof(PlaylistTemplate).GetField("<Title>k__BackingField", 
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                var descriptionField = typeof(PlaylistTemplate).GetField("<Description>k__BackingField", 
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                var choirIdField = typeof(PlaylistTemplate).GetField("<ChoirId>k__BackingField", 
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                var isDefaultField = typeof(PlaylistTemplate).GetField("<IsDefault>k__BackingField", 
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                
                templateIdField?.SetValue(virtualTemplate, globalTemplate.GlobalTemplateId);
                titleField?.SetValue(virtualTemplate, globalTemplate.TitleKey); // Store translation key
                descriptionField?.SetValue(virtualTemplate, globalTemplate.DescriptionKey ?? string.Empty);
                choirIdField?.SetValue(virtualTemplate, Guid.Empty); // Global templates don't belong to a choir
                isDefaultField?.SetValue(virtualTemplate, false); // Global templates are never default
                
                Console.WriteLine($"🚨 DEBUG - Virtual template created with reflection: ID={virtualTemplate.TemplateId}, Title={virtualTemplate.Title}");
                
                // Add sections from the global template
                Console.WriteLine($"🚨 DEBUG - Adding {globalTemplate.Sections.Count} sections to virtual template");
                foreach (var globalSection in globalTemplate.Sections.OrderBy(s => s.Order))
                {
                    Console.WriteLine($"🚨 DEBUG - Creating section: TitleKey={globalSection.TitleKey}, Order={globalSection.Order}");
                    
                    // Create section using reflection to bypass validation
                    var virtualSection = (PlaylistTemplateSection)Activator.CreateInstance(typeof(PlaylistTemplateSection), true)!;
                    
                    var sectionIdField = typeof(PlaylistTemplateSection).GetField("<TemplateSectionId>k__BackingField", 
                        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                    var sectionTitleField = typeof(PlaylistTemplateSection).GetField("<Title>k__BackingField", 
                        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                    var sectionOrderField = typeof(PlaylistTemplateSection).GetField("<Order>k__BackingField", 
                        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                    var sectionDescriptionField = typeof(PlaylistTemplateSection).GetField("<Description>k__BackingField", 
                        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                    var sectionTemplateIdField = typeof(PlaylistTemplateSection).GetField("<TemplateId>k__BackingField", 
                        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                    var sectionSuggestedTypesField = typeof(PlaylistTemplateSection).GetField("<SuggestedSongTypes>k__BackingField", 
                        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                    
                    sectionIdField?.SetValue(virtualSection, Guid.NewGuid());
                    sectionTitleField?.SetValue(virtualSection, globalSection.TitleKey); // Store translation key
                    sectionOrderField?.SetValue(virtualSection, globalSection.Order);
                    sectionDescriptionField?.SetValue(virtualSection, globalSection.DescriptionKey);
                    sectionTemplateIdField?.SetValue(virtualSection, globalTemplate.GlobalTemplateId);
                    sectionSuggestedTypesField?.SetValue(virtualSection, globalSection.SuggestedSongTypes);
                    
                    virtualTemplate.Sections.Add(virtualSection);
                    Console.WriteLine($"🚨 DEBUG - Section added successfully: {virtualSection.Title}");
                }
                
                Console.WriteLine($"🚨 DEBUG - Virtual template completed with {virtualTemplate.Sections.Count} sections");
                return Result.Ok(virtualTemplate);
            }

            return Result.Fail("Playlist template not found.");
        }

        public async Task<Result<IEnumerable<PlaylistTemplate>>> GetPlaylistTemplatesByChoirIdAsync(Guid choirId, string language = "en", string? templateTitle = null, string? templateDescription = null, string? sectionTitle = null)
        {
            // Get all existing user templates for this choir
            var userTemplates = await _playlistTemplateRepository.GetByChoirIdAsync(choirId);
            var templateList = userTemplates.ToList();

            // Get all active global templates
            var globalTemplatesResult = await _globalTemplateService.GetAllActiveTemplatesAsync();
            if (globalTemplatesResult.IsSuccess && globalTemplatesResult.Value != null)
            {
                // Convert global templates to PlaylistTemplate format for compatibility
                // This ensures the frontend dropdown can display both types seamlessly
                foreach (var globalTemplate in globalTemplatesResult.Value)
                {
                    // Create a virtual PlaylistTemplate that represents the global template
                    // CRITICAL: Use the original global template ID so the frontend can reference it correctly
                    var virtualTemplateResult = PlaylistTemplate.Create(
                        globalTemplate.TitleKey, // Store translation key directly (e.g., "generic", "mass")
                        choirId,
                        globalTemplate.DescriptionKey ?? string.Empty,
                        false // Global templates are never set as default
                    );
                    
                    if (virtualTemplateResult.IsSuccess)
                    {
                        var virtualTemplate = virtualTemplateResult.Value;
                        
                        // CRITICAL FIX: Override the template ID with the original global template ID
                        // This ensures the frontend sends the correct ID back to the backend
                        // Use reflection to set the private TemplateId field
                        var templateIdField = typeof(PlaylistTemplate).GetField("<TemplateId>k__BackingField", 
                            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                        templateIdField?.SetValue(virtualTemplate, globalTemplate.GlobalTemplateId);
                        
                        // Add sections from the global template to the virtual template
                        // This ensures the frontend receives templates with their sections
                        foreach (var globalSection in globalTemplate.Sections.OrderBy(s => s.Order))
                        {
                            var sectionResult = PlaylistTemplateSection.Create(
                                globalSection.TitleKey, // Store translation key (e.g., "opening", "worship")
                                globalTemplate.GlobalTemplateId, // Use the global template ID
                                globalSection.Order
                            );
                            
                            if (sectionResult.IsSuccess)
                            {
                                virtualTemplate.Sections.Add(sectionResult.Value);
                            }
                        }
                        
                        // Frontend will recognize translation keys like "generic", "mass" and translate them
                        // User templates will have normal titles like "My Custom Template"
                        templateList.Add(virtualTemplate);
                    }
                }
            }

            // Global templates ensure there's always at least one template available
            // No need to create per-choir generic templates anymore

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
            
            if (!userChoir.IsAdmin)
                return Result.Fail("Only choir administrators can delete playlist templates.");

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


    }
}
