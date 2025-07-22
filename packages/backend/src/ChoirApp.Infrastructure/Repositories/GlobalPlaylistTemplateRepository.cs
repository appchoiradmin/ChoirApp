using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using FluentResults;
using Microsoft.EntityFrameworkCore;

namespace ChoirApp.Infrastructure.Repositories;

public class GlobalPlaylistTemplateRepository : IGlobalPlaylistTemplateRepository
{
    private readonly ApplicationDbContext _context;

    public GlobalPlaylistTemplateRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IEnumerable<GlobalPlaylistTemplate>>> GetAllActiveAsync()
    {
        try
        {
            var templates = await _context.GlobalPlaylistTemplates
                .Where(t => t.IsActive)
                .Include(t => t.Sections)
                .OrderBy(t => t.Category)
                .ThenBy(t => t.DisplayOrder)
                .ToListAsync();

            return Result.Ok<IEnumerable<GlobalPlaylistTemplate>>(templates);
        }
        catch (Exception ex)
        {
            return Result.Fail($"Failed to retrieve global templates: {ex.Message}");
        }
    }

    public async Task<Result<IEnumerable<GlobalPlaylistTemplate>>> GetByCategoryAsync(string category)
    {
        try
        {
            var templates = await _context.GlobalPlaylistTemplates
                .Where(t => t.IsActive && t.Category == category)
                .Include(t => t.Sections)
                .OrderBy(t => t.DisplayOrder)
                .ToListAsync();

            return Result.Ok<IEnumerable<GlobalPlaylistTemplate>>(templates);
        }
        catch (Exception ex)
        {
            return Result.Fail($"Failed to retrieve global templates for category '{category}': {ex.Message}");
        }
    }

    public async Task<Result<GlobalPlaylistTemplate?>> GetByIdAsync(Guid globalTemplateId)
    {
        try
        {
            var template = await _context.GlobalPlaylistTemplates
                .FirstOrDefaultAsync(t => t.GlobalTemplateId == globalTemplateId);

            return Result.Ok(template);
        }
        catch (Exception ex)
        {
            return Result.Fail($"Failed to retrieve global template: {ex.Message}");
        }
    }

    public async Task<Result<GlobalPlaylistTemplate?>> GetByIdWithSectionsAsync(Guid globalTemplateId)
    {
        try
        {
            var template = await _context.GlobalPlaylistTemplates
                .Include(t => t.Sections.OrderBy(s => s.Order))
                .FirstOrDefaultAsync(t => t.GlobalTemplateId == globalTemplateId);

            return Result.Ok(template);
        }
        catch (Exception ex)
        {
            return Result.Fail($"Failed to retrieve global template with sections: {ex.Message}");
        }
    }

    public async Task<Result<GlobalPlaylistTemplate>> AddAsync(GlobalPlaylistTemplate template)
    {
        try
        {
            _context.GlobalPlaylistTemplates.Add(template);
            await _context.SaveChangesAsync();
            return Result.Ok(template);
        }
        catch (Exception ex)
        {
            return Result.Fail($"Failed to add global template: {ex.Message}");
        }
    }

    public async Task<Result<GlobalPlaylistTemplate>> UpdateAsync(GlobalPlaylistTemplate template)
    {
        try
        {
            _context.GlobalPlaylistTemplates.Update(template);
            await _context.SaveChangesAsync();
            return Result.Ok(template);
        }
        catch (Exception ex)
        {
            return Result.Fail($"Failed to update global template: {ex.Message}");
        }
    }

    public async Task<Result> DeleteAsync(Guid globalTemplateId)
    {
        try
        {
            var template = await _context.GlobalPlaylistTemplates
                .FirstOrDefaultAsync(t => t.GlobalTemplateId == globalTemplateId);

            if (template == null)
            {
                return Result.Fail("Global template not found.");
            }

            _context.GlobalPlaylistTemplates.Remove(template);
            await _context.SaveChangesAsync();
            return Result.Ok();
        }
        catch (Exception ex)
        {
            return Result.Fail($"Failed to delete global template: {ex.Message}");
        }
    }

    public async Task<Result<IEnumerable<string>>> GetAllCategoriesAsync()
    {
        try
        {
            var categories = await _context.GlobalPlaylistTemplates
                .Where(t => t.IsActive)
                .Select(t => t.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Result.Ok<IEnumerable<string>>(categories);
        }
        catch (Exception ex)
        {
            return Result.Fail($"Failed to retrieve template categories: {ex.Message}");
        }
    }
}
