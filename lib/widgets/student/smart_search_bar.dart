import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/app_theme.dart';

class SmartSearchBar extends StatefulWidget {
  final String hintText;
  final Function(String) onSearch;
  final Function(String) onSuggestionTap;
  final List<String> suggestions;
  final bool showRecentSearches;
  final List<String> recentSearches;

  const SmartSearchBar({
    super.key,
    required this.onSearch,
    required this.onSuggestionTap,
    this.hintText = '智能搜索学生...',
    this.suggestions = const [],
    this.showRecentSearches = true,
    this.recentSearches = const [],
  });

  @override
  State<SmartSearchBar> createState() => _SmartSearchBarState();
}

class _SmartSearchBarState extends State<SmartSearchBar> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  bool _showSuggestions = false;
  List<String> _filteredSuggestions = [];

  @override
  void initState() {
    super.initState();
    _controller.addListener(_onTextChanged);
    _focusNode.addListener(_onFocusChanged);
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onTextChanged() {
    final query = _controller.text.toLowerCase();
    setState(() {
      _filteredSuggestions = widget.suggestions
          .where((suggestion) => suggestion.toLowerCase().contains(query))
          .toList();
      _showSuggestions = query.isNotEmpty && _filteredSuggestions.isNotEmpty;
    });
  }

  void _onFocusChanged() {
    setState(() {
      _showSuggestions = _focusNode.hasFocus && 
          (_filteredSuggestions.isNotEmpty || widget.recentSearches.isNotEmpty);
    });
  }

  void _performSearch(String query) {
    widget.onSearch(query);
    _focusNode.unfocus();
    setState(() {
      _showSuggestions = false;
    });
  }

  void _onSuggestionTap(String suggestion) {
    _controller.text = suggestion;
    widget.onSuggestionTap(suggestion);
    _focusNode.unfocus();
    setState(() {
      _showSuggestions = false;
    });
  }

  void _clearSearch() {
    _controller.clear();
    widget.onSearch('');
    setState(() {
      _showSuggestions = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextField(
            controller: _controller,
            focusNode: _focusNode,
            decoration: InputDecoration(
              hintText: widget.hintText,
              hintStyle: TextStyle(color: AppTheme.textSecondary),
              prefixIcon: const Icon(Icons.search, color: AppTheme.primaryColor),
              suffixIcon: _controller.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, color: AppTheme.textTertiary),
                      onPressed: _clearSearch,
                    )
                  : IconButton(
                      icon: const Icon(Icons.tune, color: AppTheme.primaryColor),
                      onPressed: () {
                        // 打开高级搜索
                        HapticFeedback.lightImpact();
                      },
                    ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm,
              ),
            ),
            onSubmitted: _performSearch,
            onChanged: (value) {
              if (value.isEmpty) {
                _performSearch('');
              }
            },
          ),
        ),
        if (_showSuggestions) _buildSuggestionsOverlay(),
      ],
    );
  }

  Widget _buildSuggestionsOverlay() {
    return Container(
      margin: const EdgeInsets.only(top: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_filteredSuggestions.isNotEmpty) ...[
            _buildSuggestionHeader('建议'),
            ..._filteredSuggestions.take(5).map((suggestion) => 
              _buildSuggestionItem(suggestion, Icons.search)
            ),
          ],
          if (widget.showRecentSearches && widget.recentSearches.isNotEmpty) ...[
            if (_filteredSuggestions.isNotEmpty) const Divider(height: 1),
            _buildSuggestionHeader('最近搜索'),
            ...widget.recentSearches.take(3).map((search) => 
              _buildSuggestionItem(search, Icons.history)
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSuggestionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.xs),
      child: Text(
        title,
        style: AppTextStyles.caption.copyWith(
          color: AppTheme.textSecondary,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildSuggestionItem(String suggestion, IconData icon) {
    return InkWell(
      onTap: () => _onSuggestionTap(suggestion),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: AppTheme.textTertiary),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                suggestion,
                style: AppTextStyles.bodyMedium,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
