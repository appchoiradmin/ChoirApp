using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FluentResults;

namespace ChoirApp.Application.Services;

public class GlobalPlaylistTemplateService : IGlobalPlaylistTemplateService
{
    private readonly IGlobalPlaylistTemplateRepository _repository;

    public GlobalPlaylistTemplateService(IGlobalPlaylistTemplateRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<IEnumerable<GlobalPlaylistTemplateDto>>> GetAllActiveTemplatesAsync()
    {
        var result = await _repository.GetAllActiveAsync();
        if (result.IsFailed)
        {
            return Result.Fail(result.Errors);
        }

        var templates = result.Value.Select(MapToDto);
        return Result.Ok(templates);
    }

    public async Task<Result<IEnumerable<GlobalPlaylistTemplateDto>>> GetTemplatesByCategoryAsync(string category)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return Result.Fail("Category cannot be empty.");
        }

        var result = await _repository.GetByCategoryAsync(category);
        if (result.IsFailed)
        {
            return Result.Fail(result.Errors);
        }

        var templates = result.Value.Select(MapToDto);
        return Result.Ok(templates);
    }

    public async Task<Result<GlobalPlaylistTemplateDto?>> GetTemplateByIdAsync(Guid globalTemplateId)
    {
        if (globalTemplateId == Guid.Empty)
        {
            return Result.Fail("Global template ID cannot be empty.");
        }

        var result = await _repository.GetByIdWithSectionsAsync(globalTemplateId);
        if (result.IsFailed)
        {
            return Result.Fail(result.Errors);
        }

        var dto = result.Value != null ? MapToDto(result.Value) : null;
        return Result.Ok(dto);
    }

    public async Task<Result<IEnumerable<string>>> GetAllCategoriesAsync()
    {
        return await _repository.GetAllCategoriesAsync();
    }

    private static GlobalPlaylistTemplateDto MapToDto(GlobalPlaylistTemplate template)
    {
        return new GlobalPlaylistTemplateDto
        {
            GlobalTemplateId = template.GlobalTemplateId,
            TitleKey = template.TitleKey,
            DescriptionKey = template.DescriptionKey,
            Category = template.Category,
            DisplayOrder = template.DisplayOrder,
            IsActive = template.IsActive,
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt,
            Sections = template.Sections.Select(MapSectionToDto).ToList()
        };
    }

    private static GlobalPlaylistTemplateSectionDto MapSectionToDto(GlobalPlaylistTemplateSection section)
    {
        return new GlobalPlaylistTemplateSectionDto
        {
            GlobalTemplateSectionId = section.GlobalTemplateSectionId,
            TitleKey = section.TitleKey,
            DescriptionKey = section.DescriptionKey,
            SuggestedSongTypes = section.SuggestedSongTypes,
            Order = section.Order,
            GlobalTemplateId = section.GlobalTemplateId,
            CreatedAt = section.CreatedAt,
            UpdatedAt = section.UpdatedAt
        };
    }
}
