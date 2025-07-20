using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChoirApp.Infrastructure.Repositories
{
    public class PlaylistTemplateRepository : IPlaylistTemplateRepository
    {
        private readonly ApplicationDbContext _context;

        public PlaylistTemplateRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PlaylistTemplate?> GetByIdAsync(Guid templateId)
        {
            return await _context.PlaylistTemplates.FindAsync(templateId);
        }

        public async Task<PlaylistTemplate?> GetByIdWithSectionsAsync(Guid templateId)
        {
            return await _context.PlaylistTemplates
                .Include(pt => pt.Sections)
                .FirstOrDefaultAsync(pt => pt.TemplateId == templateId);
        }

        public async Task<List<PlaylistTemplate>> GetByChoirIdAsync(Guid choirId)
        {
            return await _context.PlaylistTemplates
                .Include(pt => pt.Sections)
                .Where(pt => pt.ChoirId == choirId)
                .OrderBy(pt => pt.Title)
                .ToListAsync();
        }

        public async Task<PlaylistTemplate?> GetDefaultByChoirIdAsync(Guid choirId)
        {
            return await _context.PlaylistTemplates
                .FirstOrDefaultAsync(pt => pt.ChoirId == choirId && pt.IsDefault);
        }

        public Task<PlaylistTemplate> AddAsync(PlaylistTemplate template)
        {
            _context.PlaylistTemplates.Add(template);
            return Task.FromResult(template);
        }

        public Task UpdateAsync(PlaylistTemplate template)
        {
            _context.PlaylistTemplates.Update(template);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(PlaylistTemplate template)
        {
            _context.PlaylistTemplates.Remove(template);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
        
        // Template section operations
        public async Task RemoveAllTemplateSectionsAsync(Guid templateId)
        {
            var template = await _context.PlaylistTemplates
                .Include(t => t.Sections)
                .FirstOrDefaultAsync(t => t.TemplateId == templateId);
                
            if (template != null)
            {
                _context.PlaylistTemplateSections.RemoveRange(template.Sections);
            }
        }

        public Task AddTemplateSectionAsync(PlaylistTemplateSection section)
        {
            _context.PlaylistTemplateSections.Add(section);
            return Task.CompletedTask;
        }
    }
}
