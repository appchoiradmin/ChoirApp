using ChoirApp.Domain.Entities;
using FluentResults;

namespace ChoirApp.Application.Contracts;

public interface IGlobalPlaylistTemplateRepository
{
    Task<Result<IEnumerable<GlobalPlaylistTemplate>>> GetAllActiveAsync();
    Task<Result<IEnumerable<GlobalPlaylistTemplate>>> GetByCategoryAsync(string category);
    Task<Result<GlobalPlaylistTemplate?>> GetByIdAsync(Guid globalTemplateId);
    Task<Result<GlobalPlaylistTemplate?>> GetByIdWithSectionsAsync(Guid globalTemplateId);
    Task<Result<GlobalPlaylistTemplate>> AddAsync(GlobalPlaylistTemplate template);
    Task<Result<GlobalPlaylistTemplate>> UpdateAsync(GlobalPlaylistTemplate template);
    Task<Result> DeleteAsync(Guid globalTemplateId);
    Task<Result<IEnumerable<string>>> GetAllCategoriesAsync();
}
