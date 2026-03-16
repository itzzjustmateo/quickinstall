import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSlidersH, faDownload, faHeart, faClock, faHdd, faCloudDownloadAlt, faSpinner, faCheck, faExclamationCircle, faTimes, faCube, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import debounce from 'lodash-es/debounce';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

type Platform = 'modrinth' | 'spigotmc';

interface InstalledPlugin {
    name: string;
    size: number;
    mimetype: string;
    modified_at: string;
}

const BentoCard = styled.div`
    ${tw`rounded-3xl p-7 transition-all duration-500 relative flex flex-col h-full overflow-hidden`};
    background: rgba(20, 21, 27, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 200%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
        transition: left 0.7s ease;
    }

    &:hover {
        border-color: rgba(99, 102, 241, 0.4);
        transform: translateY(-6px);
        background: rgba(24, 25, 33, 0.8);
        box-shadow: 0 20px 40px 0 rgba(0, 0, 0, 0.4), 0 0 20px 0 rgba(99, 102, 241, 0.1);
        
        &::before {
            left: 100%;
        }
    }
`;

const HeroSection = styled.div`
    ${tw`text-center py-12 md:py-20`};
`;

const HeroTitle = styled.h1`
    ${tw`text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-tight`};
    span {
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shine 4s linear infinite;
    }
    
    @keyframes shine {
        to { background-position: 200% center; }
    }
`;

const HeroSubtitle = styled.p`
    ${tw`text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed opacity-80`};
`;

const NavTabsRow = styled.div`
    ${tw`flex justify-center gap-2 mb-12`};
`;

const NavTab = styled.button<{ active: boolean }>`
    ${tw`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300`};
    background: ${(props: { active: boolean }) => props.active ? 'rgba(99, 102, 241, 0.15)' : 'transparent'};
    color: ${(props: { active: boolean }) => props.active ? 'rgb(165, 180, 252)' : 'rgba(255, 255, 255, 0.4)'};
    border: 1px solid ${(props: { active: boolean }) => props.active ? 'rgba(99, 102, 241, 0.3)' : 'transparent'};
    box-shadow: ${(props: { active: boolean }) => props.active ? '0 0 20px rgba(99, 102, 241, 0.1)' : 'none'};
    
    &:hover {
        color: ${(props: { active: boolean }) => props.active ? 'rgb(165, 180, 252)' : 'rgba(255, 255, 255, 0.8)'};
        background: ${(props: { active: boolean }) => props.active ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    }
`;

const FilterGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-6 gap-4 mb-10 bg-white/[0.03] backdrop-blur-md p-4 rounded-[2rem] border border-white/5 shadow-2xl`};
`;

const GridContainer = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16`};
    
    & > div {
        animation: cardFadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
    }

    ${[...Array(12)].map((_, i) => `& > div:nth-child(${i + 1}) { animation-delay: ${0.1 + i * 0.05}s; }`).join(' ')}

    @keyframes cardFadeIn {
        from { opacity: 0; transform: translateY(30px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
`;

const SearchInputRow = styled.div`
    ${tw`relative flex-1 md:col-span-2 group`};
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
    ${tw`w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden active:scale-95`};
    ${(props: { variant?: 'primary' | 'secondary' }) => props.variant === 'secondary' 
        ? tw`bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5` 
        : tw`bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20`};
`;

const TagBadge = styled.span`
    ${tw`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-[0.1em]`};
    background: rgba(99, 102, 241, 0.05);
    color: rgba(129, 140, 248, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.1);
    transition: all 0.2s ease;
    
    &:hover {
        background: rgba(99, 102, 241, 0.1);
        color: rgb(129, 140, 248);
        border-color: rgba(99, 102, 241, 0.2);
    }
`;

const DropdownWrapper = styled.div`
    ${tw`relative w-full`};
`;

const DropdownButton = styled.button`
    ${tw`w-full bg-white/5 border border-white/10 text-neutral-300 text-[11px] font-black uppercase tracking-wider rounded-2xl px-5 py-3 outline-none flex items-center justify-between transition-all duration-300`};
    &:hover {
        border-color: rgba(99, 102, 241, 0.4);
        background: rgba(255, 255, 255, 0.08);
    }
    &:focus {
        border-color: rgb(99, 102, 241);
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
`;

const DropdownContent = styled.div`
    ${tw`absolute z-50 w-full mt-2 rounded-xl overflow-hidden border border-white/10 shadow-2xl overflow-y-auto`};
    background: #1c1d26;
    max-height: 250px;
    
    &::-webkit-scrollbar {
        width: 4px;
    }
    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
    }
`;

const DropdownItem = styled.div<{ active: boolean }>`
    ${tw`px-5 py-3 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-200`};
    background: ${props => props.active ? 'rgba(99, 102, 241, 0.15)' : 'transparent'};
    color: ${props => props.active ? 'rgb(165, 180, 252)' : 'rgba(255, 255, 255, 0.5)'};
    
    &:hover {
        background: rgba(255, 255, 255, 0.05);
        color: white;
        padding-left: 1.5rem;
    }
`;

interface DropdownOption {
    id: string;
    name: string;
}

const PremiumDropdown = ({ value, options, onChange, placeholder = 'Select...' }: { value: string; options: DropdownOption[]; onChange: (val: string) => void; placeholder?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeOption = useMemo(() => options.find(o => o.id === value), [value, options]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <DropdownWrapper ref={dropdownRef} style={{ zIndex: isOpen ? 100 : 1 }}>
            <DropdownButton type="button" onClick={() => setIsOpen(!isOpen)}>
                <span className={activeOption ? 'text-white' : 'text-neutral-500'}>
                    {activeOption ? activeOption.name : placeholder}
                </span>
                <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </DropdownButton>
            {isOpen && (
                <DropdownContent className="animate-fade-in-down">
                    {options.map(option => (
                        <DropdownItem
                            key={option.id}
                            active={option.id === value}
                            onClick={() => {
                                onChange(option.id);
                                setIsOpen(false);
                            }}
                        >
                            {option.name}
                        </DropdownItem>
                    ))}
                </DropdownContent>
            )}
        </DropdownWrapper>
    );
};

const modrinthCategories = [
    { id: 'adventure', name: 'Adventure' },
    { id: 'cursed', name: 'Cursed' },
    { id: 'decoration', name: 'Decoration' },
    { id: 'economy', name: 'Economy' },
    { id: 'equipment', name: 'Equipment' },
    { id: 'food', name: 'Food' },
    { id: 'game-mechanics', name: 'Game Mechanics' },
    { id: 'library', name: 'Library' },
    { id: 'magic', name: 'Magic' },
    { id: 'management', name: 'Management' },
    { id: 'minigame', name: 'Minigame' },
    { id: 'mobs', name: 'Mobs' },
    { id: 'optimization', name: 'Optimization' },
    { id: 'social', name: 'Social' },
    { id: 'storage', name: 'Storage' },
    { id: 'technology', name: 'Technology' },
    { id: 'transportation', name: 'Transportation' },
    { id: 'utility', name: 'Utility' },
    { id: 'worldgen', name: 'World Generation' },
];

const spigotCategories = [
    { id: '2', name: 'Bungee - Spigot' },
    { id: '4', name: 'Spigot' },
    { id: '5', name: 'Transportation' },
    { id: '6', name: 'Chat' },
    { id: '7', name: 'Tools and Utilities' },
    { id: '8', name: 'Misc' },
    { id: '9', name: 'Libraries / APIs' },
    { id: '10', name: 'Transportation' },
    { id: '11', name: 'Chat' },
    { id: '12', name: 'Tools and Utilities' },
    { id: '17', name: 'Economy' },
    { id: '18', name: 'Game Mode' },
    { id: '22', name: 'World Management' },
    { id: '23', name: 'Mechanics' },
    { id: '24', name: 'Fun' },
];

const loadersList = [
    'paper', 'purpur', 'spigot', 'bukkit', 'folia', 'velocity', 'waterfall', 'bungeecord'
];

interface UnifiedPlugin {
    id: string;
    title: string;
    description: string;
    author: string;
    downloads: number;
    icon_url: string;
    categories: string[];
    date_modified: string;
    platform: Platform;
}

interface ModrinthVersion {
    id: string;
    name: string;
    version_type: string;
    date_published: string;
    downloads: number;
    files: {
        url: string;
        filename: string;
        primary: boolean;
        size: number;
    }[];
    game_versions: string[];
    loaders: string[];
}

interface SpigotVersion {
    id: number;
    name: string;
    releaseDate: number;
}

interface UnifiedVersion {
    id: string;
    name: string;
    version_type: string;
    date_published: string;
    downloads: number;
    files: {
        url: string;
        filename: string;
        primary: boolean;
        size: number;
    }[];
    game_versions: string[];
    loaders: string[];
}

export default () => {
    const server = ServerContext.useStoreState(state => state.server.data);
    const [platform, setPlatform] = useState<Platform>('modrinth');
    const [activeTab, setActiveTab] = useState<'browse' | 'manage'>('browse');
    const [installedPlugins, setInstalledPlugins] = useState<InstalledPlugin[]>([]);
    const [loadingInstalled, setLoadingInstalled] = useState(false);
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState({ category: '', loader: '', sort: 'relevance' });
    const [plugins, setPlugins] = useState<UnifiedPlugin[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [totalHits, setTotalHits] = useState(0);
    const [page, setPage] = useState(0);

    const [selectedPlugin, setSelectedPlugin] = useState<UnifiedPlugin | null>(null);
    const [versions, setVersions] = useState<UnifiedVersion[]>([]);
    const [versionFilters, setVersionFilters] = useState({ gameVersion: '', loader: '', type: '' });
    const [loadingVersions, setLoadingVersions] = useState(false);

    const [availableGameVersions, setAvailableGameVersions] = useState<string[]>([]);
    const [availableLoaders, setAvailableLoaders] = useState<string[]>([]);

    const searchModrinth = async (q: string, offset: number): Promise<{ plugins: UnifiedPlugin[], total: number }> => {
        const facets = [['project_type:plugin']];
        if (filters.category) facets.push([`categories:${filters.category}`]);
        if (filters.loader) facets.push([`categories:${filters.loader}`]);

        const params = new URLSearchParams({
            facets: JSON.stringify(facets),
            limit: '12',
            offset: offset.toString(),
            index: filters.sort,
        });

        if (q) params.append('query', q);

        const res = await fetch(`https://api.modrinth.com/v2/search?${params.toString()}`);
        const data = await res.json();

        const plugins: UnifiedPlugin[] = data.hits.map((p: any) => ({
            id: p.project_id,
            title: p.title,
            description: p.description,
            author: p.author,
            downloads: p.downloads,
            icon_url: p.icon_url,
            categories: p.categories,
            date_modified: p.date_modified,
            platform: 'modrinth' as Platform,
        }));

        return { plugins, total: data.total_hits };
    };

    const searchSpigot = async (q: string, offset: number): Promise<{ plugins: UnifiedPlugin[], total: number }> => {
        const pageNum = Math.floor(offset / 12) + 1;

        let url: string;
        if (q) {
            url = `https://api.spiget.org/v2/search/resources/${encodeURIComponent(q)}?field=name&size=12&page=${pageNum}&sort=-downloads`;
        } else {
            let sortParam = '-downloads';
            if (filters.sort === 'newest') sortParam = '-releaseDate';
            if (filters.sort === 'updated') sortParam = '-updateDate';

            url = `https://api.spiget.org/v2/resources?size=12&page=${pageNum}&sort=${sortParam}`;
            if (filters.category) {
                url = `https://api.spiget.org/v2/categories/${filters.category}/resources?size=12&page=${pageNum}&sort=${sortParam}`;
            }
        }

        const res = await fetch(url);
        const data = await res.json();

        const plugins: UnifiedPlugin[] = (Array.isArray(data) ? data : []).map((p: any) => ({
            id: p.id.toString(),
            title: p.name,
            description: p.tag || '',
            author: p.author?.name || 'Unknown',
            downloads: p.downloads || 0,
            icon_url: p.icon?.url ? `https://www.spigotmc.org/${p.icon.url}` : '',
            categories: p.category ? [p.category.name || 'Plugin'] : ['Plugin'],
            date_modified: new Date(p.updateDate * 1000).toISOString(),
            platform: 'spigotmc' as Platform,
        }));

        return { plugins, total: 1000 };
    };

    const searchPlugins = useCallback(async (q: string, offset: number) => {
        setLoading(true);
        try {
            let result;
            if (platform === 'modrinth') {
                result = await searchModrinth(q, offset);
            } else {
                result = await searchSpigot(q, offset);
            }
            setPlugins(result.plugins);
            setTotalHits(result.total);
        } catch (e) {
            console.error(e);
            setPlugins([]);
        } finally {
            setLoading(false);
        }
    }, [platform, filters]);

    const fetchInstalledPlugins = useCallback(async () => {
        if (!server) return;
        setLoadingInstalled(true);
        try {
            const { data } = await http.get(`/extensions/quickinstall/installed`, {
                params: { serverUuid: server.uuid }
            });
            if (data.success) {
                setInstalledPlugins(data.plugins);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingInstalled(false);
        }
    }, [server]);

    useEffect(() => {
        if (activeTab === 'manage') {
            fetchInstalledPlugins();
        }
    }, [activeTab, fetchInstalledPlugins]);

    useEffect(() => {
        if (activeTab === 'browse') {
            searchPlugins(query, page * 12);
        }
    }, [activeTab, page, query, platform, filters, searchPlugins]);

    const debouncedSearch = useCallback(debounce((q) => {
        setPage(0);
        searchPlugins(q, 0);
    }, 600), [searchPlugins]);

    useEffect(() => {
        if (activeTab === 'browse') {
            debouncedSearch(query);
        }
    }, [query, filters, platform, activeTab]);

    useEffect(() => {
        if (page > 0) {
            searchPlugins(query, page * 12);
        }
    }, [page]);

    useEffect(() => {
        setFilters({ category: '', loader: '', sort: 'relevance' });
        setQuery('');
        setPage(0);
    }, [platform]);

    const loadVersions = async (plugin: UnifiedPlugin) => {
        setSelectedPlugin(plugin);
        setLoadingVersions(true);
        setVersionFilters({ gameVersion: '', loader: '', type: '' });

        try {
            if (plugin.platform === 'modrinth') {
                const res = await fetch(`https://api.modrinth.com/v2/project/${plugin.id}/version`);
                const data: ModrinthVersion[] = await res.json();
                setVersions(data);
                setAvailableGameVersions([...new Set(data.flatMap(v => v.game_versions))].sort().reverse());
                setAvailableLoaders([...new Set(data.flatMap(v => v.loaders))]);
            } else {
                const res = await fetch(`https://api.spiget.org/v2/resources/${plugin.id}/versions?size=20&sort=-releaseDate`);
                const data: SpigotVersion[] = await res.json();

                const versions: UnifiedVersion[] = data.map((v, idx) => ({
                    id: v.id.toString(),
                    name: v.name || `Version ${v.id}`,
                    version_type: 'release',
                    date_published: new Date(v.releaseDate * 1000).toISOString(),
                    downloads: 0,
                    files: [{
                        url: `https://api.spiget.org/v2/resources/${plugin.id}/versions/${v.id}/download`,
                        filename: `${plugin.title.replace(/[^a-zA-Z0-9]/g, '_')}.jar`,
                        primary: true,
                        size: 0,
                    }],
                    game_versions: [],
                    loaders: ['spigot', 'paper', 'bukkit'],
                }));

                setVersions(versions);
                setAvailableGameVersions([]);
                setAvailableLoaders(['spigot', 'paper', 'bukkit']);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingVersions(false);
        }
    };

    const deletePlugin = async (filename: string) => {
        if (!server) return;
        if (!confirm(`Are you sure you want to remove ${filename}?`)) return;

        try {
            await http.post(`/extensions/quickinstall/remove`, {
                filename,
                serverUuid: server.uuid
            });
            fetchInstalledPlugins();
        } catch (e: any) {
            console.error(e);
            alert('Failed to delete: ' + (e.response?.data?.message || e.message));
        }
    };

    const sortOptions = [
        { id: 'relevance', name: 'Relevance' },
        { id: 'downloads', name: 'Downloads' },
        ...(platform === 'modrinth' ? [{ id: 'follows', name: 'Popularity' }] : []),
        { id: 'newest', name: 'Newest' },
        { id: 'updated', name: 'Updated' },
    ];

    const downloadVersion = async (version: UnifiedVersion, file: UnifiedVersion['files'][0], btn: HTMLButtonElement) => {
        if (!server) return;

        const originalText = btn.innerText;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Downloading...`;
        btn.classList.add('opacity-75', 'cursor-not-allowed');

        try {
            await http.post(`/extensions/quickinstall/download`, {
                downloadUrl: file.url,
                filename: file.filename,
                serverUuid: server.uuid
            });

            btn.innerHTML = `<i class="fas fa-check"></i> Success`;
            btn.classList.replace('bg-indigo-600', 'bg-green-600');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.replace('bg-green-600', 'bg-indigo-600');
                btn.classList.remove('opacity-75', 'cursor-not-allowed');
            }, 3000);
        } catch (e: any) {
            console.error(e);
            btn.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error`;
            btn.classList.replace('bg-indigo-600', 'bg-red-600');
            alert('Failed to download: ' + (e.response?.data?.message || e.message));
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.replace('bg-red-600', 'bg-indigo-600');
                btn.classList.remove('opacity-75', 'cursor-not-allowed');
            }, 3000);
        }
    };

    const filteredVersions = versions.filter(v => {
        if (versionFilters.gameVersion && !v.game_versions.includes(versionFilters.gameVersion)) return false;
        if (versionFilters.loader && !v.loaders.includes(versionFilters.loader)) return false;
        if (versionFilters.type && v.version_type !== versionFilters.type) return false;
        return true;
    });

    const currentCategories = platform === 'modrinth' ? modrinthCategories : spigotCategories;

    return (
        <div className="min-h-screen text-neutral-200 font-sans relative overflow-x-hidden" style={{ background: '#07080c' }}>
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                
                <HeroSection>
                    <HeroTitle>Easily <span>Install</span> your favourite<br/>Minecraft: Java Edition Plugins.</HeroTitle>
                    <HeroSubtitle>
                        Browse thousands of high-quality plugins from Modrinth and SpigotMC. 
                        Install them directly to your server with just one click.
                    </HeroSubtitle>

                    <NavTabsRow>
                        <NavTab active={activeTab === 'browse'} onClick={() => setActiveTab('browse')}>Browse Plugins</NavTab>
                        <NavTab active={activeTab === 'manage'} onClick={() => setActiveTab('manage')}>Manage Plugins</NavTab>
                    </NavTabsRow>
                </HeroSection>

                {activeTab === 'browse' ? (
                    <>
                        {/* Filter Bar */}
                        <FilterGrid>
                            <div>
                                <PremiumDropdown
                                    value={platform}
                                    options={[{ id: 'modrinth', name: 'Modrinth' }, { id: 'spigotmc', name: 'SpigotMC' }]}
                                    onChange={val => setPlatform(val as Platform)}
                                />
                            </div>
                            <div>
                                <PremiumDropdown
                                    value=""
                                    options={[{ id: '', name: 'Any Size' }]}
                                    onChange={() => {}}
                                />
                            </div>
                            <div>
                                <PremiumDropdown
                                    value={filters.sort}
                                    options={sortOptions}
                                    onChange={val => setFilters({ ...filters, sort: val })}
                                />
                            </div>
                            <div>
                                <PremiumDropdown
                                    value={filters.loader}
                                    options={[{ id: '', name: 'Any Loader' }, ...loadersList.map(l => ({ id: l, name: l.charAt(0).toUpperCase() + l.slice(1) }))]}
                                    onChange={val => setFilters({ ...filters, loader: val })}
                                />
                            </div>
                            <SearchInputRow>
                                <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-xs" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    className="w-full bg-[#1c1d26] border border-white/10 text-neutral-200 text-xs font-semibold rounded-xl focus:ring-1 focus:ring-indigo-500 block pl-10 pr-4 py-2.5 transition-all outline-none placeholder-neutral-600"
                                    placeholder="Search plugins..."
                                />
                            </SearchInputRow>
                        </FilterGrid>

                        {/* Results Section */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                <p className="text-neutral-500 text-sm font-medium">Fetching plugins...</p>
                            </div>
                        ) : (
                            <>
                                <GridContainer>
                                    {plugins.map(plugin => (
                                        <BentoCard key={`${plugin.platform}-${plugin.id}`}>
                                            <div className="flex gap-4 mb-6">
                                                <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex-shrink-0 overflow-hidden border border-white/5 shadow-inner">
                                                    <img
                                                        src={plugin.icon_url || 'https://via.placeholder.com/64'}
                                                        alt={plugin.title}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64'; }}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <h3 className="text-base font-bold text-white mb-1 truncate leading-tight group-hover:text-indigo-400 transition-colors">{plugin.title}</h3>
                                                    <div className="flex items-center gap-2 text-neutral-500 text-[11px] font-bold uppercase tracking-wider">
                                                        <span>{plugin.author}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <p className="text-neutral-400 text-sm mb-6 line-clamp-2 leading-relaxed flex-1">
                                                {plugin.description || "No description provided."}
                                            </p>
                                            
                                            <div className="flex flex-wrap gap-1.5 mb-6">
                                                {plugin.categories.slice(0, 3).map(cat => (
                                                    <TagBadge key={cat}>{cat}</TagBadge>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center mb-6 px-1">
                                                <div className="flex flex-col items-start">
                                                    <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-0.5">Downloads</span>
                                                    <span className="text-white text-sm font-extrabold flex items-center gap-1.5">
                                                        <FontAwesomeIcon icon={faDownload} className="text-indigo-500 text-[10px]" />
                                                        {(plugin.downloads / 1000).toFixed(1)}k
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-0.5">Platform</span>
                                                    <span className="text-white text-sm font-extrabold">
                                                        {plugin.platform === 'modrinth' ? 'Modrinth' : 'SpigotMC'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                                <ActionButton variant="secondary" onClick={() => loadVersions(plugin)}>
                                                    Details
                                                </ActionButton>
                                                <ActionButton onClick={() => loadVersions(plugin)}>
                                                    Install
                                                </ActionButton>
                                            </div>
                                        </BentoCard>
                                    ))}
                                </GridContainer>

                                {/* Pagination */}
                                {totalHits > 12 && (
                                    <div className="flex justify-center items-center gap-6 pb-12">
                                        <button 
                                            disabled={page === 0} 
                                            onClick={() => setPage(page - 1)} 
                                            className="w-10 h-10 rounded-full border border-white/5 bg-[#14151b] text-neutral-400 hover:text-white hover:border-white/10 disabled:opacity-30 transition-all flex items-center justify-center"
                                        >
                                            <FontAwesomeIcon icon={faChevronDown} className="rotate-90 text-xs" />
                                        </button>
                                        <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Page {page + 1}</span>
                                        <button 
                                            disabled={(page + 1) * 12 >= totalHits} 
                                            onClick={() => setPage(page + 1)} 
                                            className="w-10 h-10 rounded-full border border-white/5 bg-[#14151b] text-neutral-400 hover:text-white hover:border-white/10 disabled:opacity-30 transition-all flex items-center justify-center"
                                        >
                                            <FontAwesomeIcon icon={faChevronDown} className="-rotate-90 text-xs" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <div className="pb-24">
                        {loadingInstalled ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                <p className="text-neutral-500 text-sm font-medium">Loading installed plugins...</p>
                            </div>
                        ) : installedPlugins.length === 0 ? (
                            <div className="text-center py-24 bg-[#14151b] rounded-3xl border border-white/5">
                                <FontAwesomeIcon icon={faCube} className="text-neutral-700 text-5xl mb-6" />
                                <h3 className="text-xl font-bold text-white mb-2">No plugins found</h3>
                                <p className="text-neutral-500 max-w-xs mx-auto text-sm">
                                    Plugins installed through this panel with the <code className="text-indigo-400">panel-</code> prefix will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {installedPlugins.map(plugin => (
                                    <BentoCard key={plugin.name}>
                                        <div className="flex gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                                <FontAwesomeIcon icon={faCube} className="text-indigo-400 text-xl" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-white mb-1 truncate leading-tight">{plugin.name.replace('panel-', '')}</h3>
                                                <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                                                    <span>{(plugin.size / 1024 / 1024).toFixed(2)} MB</span>
                                                    <span>•</span>
                                                    <span>{new Date(plugin.modified_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-auto grid grid-cols-2 gap-3">
                                            <ActionButton variant="secondary" onClick={() => setActiveTab('browse')}>
                                                Update
                                            </ActionButton>
                                            <ActionButton className="!bg-red-600/10 !text-red-500 !border-red-600/20 hover:!bg-red-600/20" onClick={() => deletePlugin(plugin.name)}>
                                                Remove
                                            </ActionButton>
                                        </div>
                                    </BentoCard>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Version Modal */}
                {selectedPlugin && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
                        <div className="bg-[#0f1016] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-white/5 flex justify-between items-start bg-gradient-to-b from-[#14151b] to-transparent">
                                <div className="flex gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-neutral-800 overflow-hidden border border-white/5 shadow-lg">
                                        <img
                                            src={selectedPlugin.icon_url || 'https://via.placeholder.com/80'}
                                            alt={selectedPlugin.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-black text-white mb-2">{selectedPlugin.title}</h2>
                                        <div className="flex flex-wrap gap-2">
                                            <TagBadge>{selectedPlugin.platform}</TagBadge>
                                            <TagBadge>{(selectedPlugin.downloads / 1000).toFixed(1)}k Installs</TagBadge>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedPlugin(null)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-all">
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            <div className="p-8 flex-1 overflow-y-auto">
                                <div className="mb-8">
                                    <h4 className="text-neutral-500 text-[10px] uppercase font-black tracking-[0.2em] mb-4">Select Version</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <PremiumDropdown
                                                placeholder="Minecraft Version"
                                                value={versionFilters.gameVersion}
                                                options={[{ id: '', name: 'Any Version' }, ...availableGameVersions.map(v => ({ id: v, name: v }))]}
                                                onChange={val => setVersionFilters({ ...versionFilters, gameVersion: val })}
                                            />
                                        </div>
                                        <div>
                                            <PremiumDropdown
                                                placeholder="Server Loader"
                                                value={versionFilters.loader}
                                                options={[{ id: '', name: 'Any Loader' }, ...availableLoaders.map(v => ({ id: v, name: v }))]}
                                                onChange={val => setVersionFilters({ ...versionFilters, loader: val })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-neutral-500 text-[10px] uppercase font-black tracking-[0.2em] mb-4">Available Releases</h4>
                                    {loadingVersions ? (
                                        <div className="py-12 flex justify-center"><FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-indigo-500" /></div>
                                    ) : filteredVersions.length === 0 ? (
                                        <div className="py-12 text-center text-neutral-500 font-medium border-2 border-dashed border-white/5 rounded-2xl italic">No matching versions found.</div>
                                    ) : (
                                        filteredVersions.map(v => {
                                            const file = v.files.find(f => f.primary) || v.files[0];
                                            if (!file) return null;
                                            return (
                                                <div key={v.id} className="bg-[#14151b] rounded-2xl p-5 flex items-center justify-between gap-4 border border-white/5 hover:border-white/10 transition-all">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="font-extrabold text-white text-base">{v.name}</span>
                                                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md ${v.version_type === 'release' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'}`}>{v.version_type}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-[11px] text-neutral-500 font-bold uppercase tracking-wider">
                                                            <span className="flex items-center gap-1.5"><FontAwesomeIcon icon={faClock} className="text-[10px]" /> {new Date(v.date_published).toLocaleDateString()}</span>
                                                            {v.downloads > 0 && <span className="flex items-center gap-1.5"><FontAwesomeIcon icon={faCloudDownloadAlt} className="text-[10px]" /> {v.downloads}</span>}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => downloadVersion(v, file, e.currentTarget)}
                                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap shadow-lg"
                                                    >
                                                        <FontAwesomeIcon icon={faDownload} /> Install
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
