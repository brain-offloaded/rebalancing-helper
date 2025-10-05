import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useGetTagsQuery,
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

type Tag = GetTagsQuery['tags'][number];

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
  const [createTag] = useCreateTagMutation();
  const [updateTag] = useUpdateTagMutation();
  const [deleteTag] = useDeleteTagMutation();

  const tags = useMemo(() => data?.tags ?? [], [data]);

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
