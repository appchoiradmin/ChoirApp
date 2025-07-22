using ChoirApp.Application.Dtos;
using FluentResults;

namespace ChoirApp.Application.Contracts;

public interface IGlobalPlaylistTemplateService
{
    /// <summary>
    /// Gets all active global templates, grouped by category and ordered by display order
    /// </summary>
    Task<Result<IEnumerable<GlobalPlaylistTemplateDto>>> GetAllActiveTemplatesAsync();
    
    /// <summary>
    /// Gets all active global templates for a specific category
    /// </summary>
    Task<Result<IEnumerable<GlobalPlaylistTemplateDto>>> GetTemplatesByCategoryAsync(string category);
    
    /// <summary>
    /// Gets a specific global template by ID with all its sections
    /// </summary>
    Task<Result<GlobalPlaylistTemplateDto?>> GetTemplateByIdAsync(Guid globalTemplateId);
    
    /// <summary>
    /// Gets all available template categories for organizing the dropdown
    /// </summary>
    Task<Result<IEnumerable<string>>> GetAllCategoriesAsync();
}
