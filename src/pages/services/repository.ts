import {Repository} from "../models/repository";
import {RepositoryRepository} from "../repository/repository";

export class RepositoryService {
    repo: RepositoryRepository;

    constructor(repo: RepositoryRepository) {
        this.repo = repo;
    }

    public async list() {
        return this.repo.list();
    }

    public async new(repo: Repository) {
        this.repo.new(repo);
    }
}
