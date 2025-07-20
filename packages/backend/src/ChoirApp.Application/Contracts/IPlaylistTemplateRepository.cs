using ChoirApp.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface IPlaylistTemplateRepository
    {
        Task<PlaylistTemplate?> GetByIdAsync(Guid templateId);
        Task<PlaylistTemplate?> GetByIdWithSectionsAsync(Guid templateId);
        Task<List<PlaylistTemplate>> GetByChoirIdAsync(Guid choirId);
        Task<PlaylistTemplate?> GetDefaultByChoirIdAsync(Guid choirId);
        Task<PlaylistTemplate> AddAsync(PlaylistTemplate template);
        Task UpdateAsync(PlaylistTemplate template);
        Task DeleteAsync(PlaylistTemplate template);
        Task SaveChangesAsync();
        
        // Template section operations
        Task RemoveAllTemplateSectionsAsync(Guid templateId);
        Task AddTemplateSectionAsync(PlaylistTemplateSection section);
    }
}
