import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useGetHoldingTagsQuery,
  useGetTagsQuery,
  useRemoveHoldingTagMutation,
  useUpdateTagMutation,
  type GetTagsQuery,
} from '../graphql/__generated__';
import { Button, ButtonGroup } from './ui/Button';
import { Card, CardActions, CardHeader, CardTitle } from './ui/Card';
import {
  Form,
  Field,
  FieldLabel,
  HelperText,
  TextInput,
} from './ui/FormControls';
import {
  Grid,
  Section,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from './ui/Layout';
import { TagBadge } from './ui/Tag';

const ColorPalette = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ColorSwatch = styled.button<{ $selected: boolean; $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: ${({ $selected }) =>
    $selected ? '3px solid #0f172a' : '1px solid #d1d5db'};
  background-color: ${({ $color }) => $color};
  cursor: pointer;
`;

const LinkedSymbolList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const LinkedSymbolItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.light};
`;

type Tag = GetTagsQuery['tags'][number];
type HoldingTagLink = {
  id: string;
  holdingSymbol: string;
  tagId: string;
};

type TagFormState = {
  name: string;
  description: string;
  color: string;
};

const DEFAULT_COLORS = [
  '#007bff',
  '#28a745',
  '#ffc107',
  '#dc3545',
  '#17a2b8',
  '#6f42c1',
  '#e83e8c',
  '#fd7e14',
  '#20c997',
  '#6c757d',
];

const INITIAL_FORM_STATE: TagFormState = {
  name: '',
  description: '',
  color: DEFAULT_COLORS[0],
};

export const Tags: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formState, setFormState] = useState<TagFormState>(INITIAL_FORM_STATE);

  const { data, loading, error, refetch } = useGetTagsQuery();
  const {
    data: holdingTagsData,
    loading: holdingTagsLoading,
    refetch: refetchHoldingTags,
  } = useGetHoldingTagsQuery();
  const [createTag] = useCreateTagMutation();
  const [updateTag] = useUpdateTagMutation();
  const [deleteTag] = useDeleteTagMutation();
  const [removeHoldingTag] = useRemoveHoldingTagMutation();

  const tags = useMemo(() => data?.tags ?? [], [data]);
  const holdingTagsByTagId = useMemo(() => {
    const map = new Map<string, HoldingTagLink[]>();
    const holdingTags = holdingTagsData?.holdingTags ?? [];

    for (const link of holdingTags) {
      const current = map.get(link.tagId) ?? [];
      current.push(link);
      map.set(link.tagId, current);
    }

    for (const links of map.values()) {
      links.sort((left, right) =>
        left.holdingSymbol.localeCompare(right.holdingSymbol, 'ko', {
          sensitivity: 'base',
          numeric: true,
        }),
      );
    }

    return map;
  }, [holdingTagsData?.holdingTags]);

  const handleChange = useCallback(
    <Key extends keyof TagFormState>(key: Key, value: TagFormState[Key]) => {
      setFormState((previous) => ({ ...previous, [key]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormState(INITIAL_FORM_STATE);
    setEditingTag(null);
    setIsFormOpen(false);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        if (editingTag) {
          await updateTag({
            variables: { input: { id: editingTag.id, ...formState } },
          });
        } else {
          await createTag({ variables: { input: formState } });
        }
        resetForm();
        refetch();
      } catch (mutationError) {
        console.error('태그 저장 실패:', mutationError);
      }
    },
    [createTag, editingTag, formState, refetch, resetForm, updateTag],
  );

  const handleEdit = useCallback((tag: Tag) => {
    setEditingTag(tag);
    setFormState({
      name: tag.name,
      description: tag.description ?? '',
      color: tag.color,
    });
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('이 태그를 삭제하시겠습니까?')) {
        return;
      }
      try {
        await deleteTag({ variables: { id } });
        refetch();
      } catch (mutationError) {
        console.error('태그 삭제 실패:', mutationError);
      }
    },
    [deleteTag, refetch],
  );

  const handleRemoveHoldingTag = useCallback(
    async (tag: Tag, holdingSymbol: string) => {
      if (
        !window.confirm(
          `${holdingSymbol} 종목에서 ${tag.name} 태그를 해제하시겠습니까?`,
        )
      ) {
        return;
      }

      try {
        await removeHoldingTag({
          variables: {
            input: {
              holdingSymbol,
              tagId: tag.id,
            },
          },
        });
        refetchHoldingTags();
      } catch (mutationError) {
        console.error('종목 태그 해제 실패:', mutationError);
      }
    },
    [refetchHoldingTags, removeHoldingTag],
  );

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>오류 발생: {error.message}</div>;
  }

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>태그 관리</SectionTitle>
        <SectionDescription>
          보유 종목을 분류하기 위한 태그를 관리합니다.
        </SectionDescription>
      </SectionHeader>

      <Button
        variant="primary"
        onClick={() => setIsFormOpen((previous) => !previous)}
      >
        {isFormOpen ? '취소' : '태그 추가'}
      </Button>

      {isFormOpen ? (
        <Card as="section">
          <CardTitle>{editingTag ? '태그 수정' : '새 태그 추가'}</CardTitle>
          <Form onSubmit={handleSubmit}>
            <Field>
              <FieldLabel htmlFor="tag-name">태그 이름</FieldLabel>
              <TextInput
                id="tag-name"
                value={formState.name}
                onChange={(event) => handleChange('name', event.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="tag-description">설명</FieldLabel>
              <TextInput
                id="tag-description"
                value={formState.description}
                onChange={(event) =>
                  handleChange('description', event.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel>색상</FieldLabel>
              <ColorPalette>
                {DEFAULT_COLORS.map((color) => (
                  <ColorSwatch
                    key={color}
                    type="button"
                    $selected={formState.color === color}
                    $color={color}
                    onClick={() => handleChange('color', color)}
                    aria-label={`색상 ${color}`}
                  />
                ))}
              </ColorPalette>
              <TextInput
                type="color"
                value={formState.color}
                onChange={(event) => handleChange('color', event.target.value)}
                style={{ width: '80px', height: '40px' }}
                aria-label="색상 직접 선택"
              />
              <HelperText>
                색상은 태그를 시각적으로 구분하는 데 사용됩니다.
              </HelperText>
            </Field>

            <ButtonGroup>
              <Button type="submit" variant="primary">
                {editingTag ? '수정' : '추가'}
              </Button>
              <Button type="button" onClick={resetForm}>
                취소
              </Button>
            </ButtonGroup>
          </Form>
        </Card>
      ) : null}

      <Grid minWidth="300px">
        {tags.map((tag) => (
          <Card key={tag.id} as="article">
            <CardHeader>
              <CardTitle>
                <TagBadge color={tag.color}>{tag.name}</TagBadge>
              </CardTitle>
            </CardHeader>
            {tag.description ? <p>{tag.description}</p> : null}
            <div>
              <strong>연결 종목</strong>
              {holdingTagsLoading ? (
                <p>종목 연결을 불러오는 중입니다.</p>
              ) : (holdingTagsByTagId.get(tag.id) ?? []).length === 0 ? (
                <p>연결된 종목이 없습니다.</p>
              ) : (
                <LinkedSymbolList>
                  {(holdingTagsByTagId.get(tag.id) ?? []).map((link) => (
                    <LinkedSymbolItem key={link.id}>
                      {link.holdingSymbol}
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`${link.holdingSymbol} ${tag.name} 태그 해제`}
                        onClick={() =>
                          handleRemoveHoldingTag(tag, link.holdingSymbol)
                        }
                      >
                        해제
                      </Button>
                    </LinkedSymbolItem>
                  ))}
                </LinkedSymbolList>
              )}
            </div>
            <CardActions>
              <Button onClick={() => handleEdit(tag)}>수정</Button>
              <Button variant="danger" onClick={() => handleDelete(tag.id)}>
                삭제
              </Button>
            </CardActions>
          </Card>
        ))}
      </Grid>
    </Section>
  );
};
